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

    console.log("Extracted userInfo from JWT:", JSON.stringify(userInfo, null, 2));

    // Get primary wallet address (if available)
    const primaryWallet = userInfo.wallets.find((wallet: any) => 
      wallet.type === "web3auth_app_key"
    );
    
    let walletAddress = null;
    let externalWallet = userInfo.wallets.find((wallet: any) => 
      wallet.type === "ethereum" || wallet.type === "external"
    );
    if (primaryWallet) {
      walletAddress = primaryWallet.public_key;
    } else {
      if (externalWallet) {
        walletAddress = externalWallet.address;
      } else {
        // Fallback to other sources
        walletAddress = (payload as any).address || (payload as any).wallet_address;
      }
    }

    // Normalize wallet address to lowercase for consistency (if available)
    if (walletAddress) {
      walletAddress = walletAddress.toLowerCase();
    }

    // If no web3auth_id, generate one based on available data
    if (!userInfo.web3auth_id) {
      if (walletAddress) {
        userInfo.web3auth_id = `wallet_${walletAddress}`;
      } else if (userInfo.email) {
        userInfo.web3auth_id = userInfo.email;
      } else if (userInfo.name) {
        userInfo.web3auth_id = `name_${userInfo.name}`;
      } else {
        userInfo.web3auth_id = `user_${Date.now()}`;
      }
    }

    console.log("Final web3auth_id after fallback:", userInfo.web3auth_id);

    // Connect to Supabase
    const supabase = await createSupabaseServerClient();

    // Check if user already exists by web3auth_id first
    console.log("Checking for existing user with web3auth_id:", userInfo.web3auth_id);
    let { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('web3auth_id', userInfo.web3auth_id)
      .single();

    // If not found by web3auth_id and we have an email, try searching by email
    if (fetchError && fetchError.code === 'PGRST116' && userInfo.email) {
      console.log("User not found by web3auth_id, trying to find by email:", userInfo.email);
      const { data: existingUserByEmail, error: emailFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userInfo.email)
        .single();
      
      if (existingUserByEmail) {
        console.log("Found existing user by email:", existingUserByEmail.id);
        existingUser = existingUserByEmail;
        fetchError = null;
      } else if (emailFetchError && emailFetchError.code !== 'PGRST116') {
        console.error('Error fetching user by email:', emailFetchError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingUser) {
      console.log("Found existing user:", existingUser.id);
    } else {
      console.log("No existing user found, creating new user");
    }

    let user;
    let isNewUser = false;
    
    if (existingUser) {
      // Update existing user - make sure to update web3auth_id if it's different
      const updateData: any = {
        display_name: userInfo.name || existingUser.display_name,
        email: userInfo.email || existingUser.email,
        evm_wallet_address: walletAddress || existingUser.evm_wallet_address,
        web3auth_wallet_address: walletAddress || existingUser.web3auth_wallet_address,
        updated_at: new Date().toISOString()
      }
      
      // If web3auth_id is different, update it too
      if (existingUser.web3auth_id !== userInfo.web3auth_id) {
        console.log("Updating web3auth_id from", existingUser.web3auth_id, "to", userInfo.web3auth_id);
        updateData.web3auth_id = userInfo.web3auth_id;
      }
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', existingUser.id)
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
          evm_wallet_address: walletAddress || null,
          web3auth_wallet_address: walletAddress || null,
          xp: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        // If insert fails due to duplicate email, try to find and update the existing user
        if (insertError.code === '23505' && userInfo.email) {
          console.log("Insert failed due to duplicate email, trying to find and update existing user");
          const { data: existingUserByEmail, error: emailFetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userInfo.email)
            .single();
          
          if (existingUserByEmail) {
            console.log("Found existing user by email, updating:", existingUserByEmail.id);
            const { data: updatedUser, error: updateError } = await supabase
              .from('profiles')
              .update({
                web3auth_id: userInfo.web3auth_id,
                display_name: userInfo.name || existingUserByEmail.display_name,
                evm_wallet_address: walletAddress || existingUserByEmail.evm_wallet_address,
                web3auth_wallet_address: walletAddress || existingUserByEmail.web3auth_wallet_address,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUserByEmail.id)
              .select()
              .single();
            
            if (updateError) {
              console.error('Error updating existing user:', updateError);
              return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
            }
            
            user = updatedUser;
            isNewUser = false; // It's not a new user, just an update
          } else if (emailFetchError && emailFetchError.code !== 'PGRST116') {
            console.error('Error fetching user by email:', emailFetchError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
          } else {
            console.error('Error creating user:', insertError);
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
          }
        } else {
          console.error('Error creating user:', insertError);
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }
      } else {
        user = data;
      }
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        evm_wallet_address: walletAddress || null,
        web3auth_wallet_address: walletAddress || null,
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
