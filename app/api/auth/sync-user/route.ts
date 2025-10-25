import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.split(" ")[1];

    if (!idToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify JWT using Web3Auth JWKS
    let payload;
    try {
      const jwks = jose.createRemoteJWKSet(new URL("https://api-auth.web3auth.io/jwks"));
      const result = await jose.jwtVerify(idToken, jwks, { algorithms: ["ES256"] });
      payload = result.payload;
      
      // Debug: Log the payload to understand the structure
      console.log("JWT Payload:", JSON.stringify(payload, null, 2));
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    // Extract user information from token
    const userInfo = {
      web3auth_id: (payload as any).userId || (payload as any).verifierId || payload.sub as string,
      email: payload.email as string || null,
      name: payload.name as string || null,
      wallets: (payload as any).wallets || []
    };

    // Get primary wallet address
    const primaryWallet = userInfo.wallets.find((wallet: any) => 
      wallet.type === "web3auth_app_key"
    );
    
    let walletAddress;
    if (primaryWallet) {
      walletAddress = primaryWallet.public_key;
    } else {
      // For external wallets like Rabby, get address from wallets array
      const externalWallet = userInfo.wallets.find((wallet: any) => 
        wallet.type === "ethereum" || wallet.type === "external"
      );
      if (externalWallet) {
        walletAddress = externalWallet.address;
      } else {
        // Fallback to other sources
        walletAddress = (payload as any).address || (payload as any).wallet_address;
      }
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "No wallet address found in token" }, { status: 400 });
    }

    // Normalize wallet address to lowercase for consistency
    walletAddress = walletAddress.toLowerCase();

    // If no web3auth_id, use wallet address as fallback
    if (!userInfo.web3auth_id) {
      userInfo.web3auth_id = `wallet_${walletAddress}`;
    }

    // Connect to Supabase
    const supabase = await createSupabaseServerClient();

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('web3auth_id', userInfo.web3auth_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let user;
    let isNewUser = false;
    
    if (existingUser) {
      // Update existing user
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: userInfo.name || existingUser.display_name,
          email: userInfo.email || existingUser.email,
          wallet_address: walletAddress,
          updated_at: new Date().toISOString()
        })
        .eq('web3auth_id', userInfo.web3auth_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      user = data;
    } else {
      // Create new user
      isNewUser = true;
      
      // Generate username based on available data
      let username;
      if (userInfo.email) {
        username = userInfo.email.split('@')[0];
      } else if (userInfo.name) {
        username = userInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      } else {
        username = `user_${userInfo.web3auth_id.slice(0, 8)}`;
      }
      
      // Ensure username is unique by adding suffix if needed
      let finalUsername = username;
      let counter = 1;
      while (true) {
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', finalUsername)
          .single();
        
        if (!existingUsername) break;
        finalUsername = `${username}_${counter}`;
        counter++;
      }
      
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert({
          web3auth_id: userInfo.web3auth_id,
          username: finalUsername,
          display_name: userInfo.name || 'Anonymous User',
          email: userInfo.email,
          wallet_address: walletAddress,
          xp: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      user = data;
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        wallet_address: user.wallet_address,
        xp: user.xp,
        web3auth_id: user.web3auth_id
      }
    });

  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json({ 
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
