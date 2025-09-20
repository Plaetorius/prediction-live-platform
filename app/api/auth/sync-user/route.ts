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
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    // Extract user information from token
    const userInfo = {
      web3auth_id: (payload as any).userId || (payload as any).verifierId || payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      wallets: (payload as any).wallets || []
    };

    if (!userInfo.web3auth_id) {
      return NextResponse.json({ error: "Invalid token: missing user ID" }, { status: 400 });
    }

    // Get primary wallet address
    const primaryWallet = userInfo.wallets.find((wallet: any) => 
      wallet.type === "web3auth_app_key"
    );
    
    if (!primaryWallet) {
      return NextResponse.json({ error: "No wallet found in token" }, { status: 400 });
    }

    const walletAddress = primaryWallet.public_key;

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
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert({
          web3auth_id: userInfo.web3auth_id,
          username: userInfo.email?.split('@')[0] || `user_${userInfo.web3auth_id.slice(0, 8)}`,
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
