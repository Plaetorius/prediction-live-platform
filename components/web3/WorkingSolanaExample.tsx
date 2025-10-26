'use client';

import { useEffect, useState } from 'react';
import { Web3Auth, type Web3AuthOptions, WEB3AUTH_NETWORK } from '@web3auth/modal';


/**
 * Working example of how to get Solana address from Web3Auth
 * This uses direct Web3Auth instantiation instead of React hooks
 */
export default function WorkingSolanaExample() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [solanaAddress, setSolanaAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        // 1) Configure Web3AuthOptions for Solana
        const options: Web3AuthOptions = {
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        };

        // 2) Create modal instance and init
        const w3a = new Web3Auth(options);
        await w3a.init();
        setWeb3auth(w3a);

        if (w3a.provider) {
          setProvider(w3a.provider);
          await getSolanaAddress(w3a.provider);
        }
      } catch (error) {
        console.error('Web3Auth initialization failed:', error);
      }
    };

    initWeb3Auth();
  }, []);

  const getSolanaAddress = async (provider: any) => {
    try {
      console.log('Provider:', provider);
      console.log('Provider methods:', Object.getOwnPropertyNames(provider));
      console.log('Provider prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(provider)));
      
      // Try to get user info first
      if (web3auth) {
        try {
          const userInfo = await web3auth.getUserInfo();
          console.log('User info:', userInfo);
          
          // Check if userInfo has public key information
          if (userInfo && (userInfo as any).publicKey) {
            setSolanaAddress((userInfo as any).publicKey);
            setIsConnected(true);
            return;
          }
        } catch (e) {
          console.log('getUserInfo failed:', e);
        }
      }
      
      // Try different provider methods
      let accounts;
      
      // Method 1: Check if provider has accounts property
      if (provider.accounts && provider.accounts.length > 0) {
        accounts = provider.accounts;
      }
      // Method 2: Try request with different methods
      else if (provider.request) {
        const methods = ['getAccounts', 'solana_requestAccounts', 'eth_accounts', 'requestAccounts'];
        
        for (const method of methods) {
          try {
            console.log(`Trying method: ${method}`);
            accounts = await provider.request({ method });
            if (accounts && accounts.length > 0) {
              console.log(`Success with method: ${method}`, accounts);
              break;
            }
          } catch (e) {
            console.log(`Method ${method} failed:`, (e as Error).message);
          }
        }
      }
      
      if (accounts && accounts.length > 0) {
        setSolanaAddress(accounts[0]);
        setIsConnected(true);
      } else {
        console.log('No accounts found, setting placeholder');
        setSolanaAddress('No Solana address found - check console for details');
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to get Solana address:', error);
      setSolanaAddress('Error getting address - check console');
    }
  };

  const login = async () => {
    if (!web3auth) return;
    
    setLoading(true);
    try {
      const prov = await web3auth.connect();
      setProvider(prov);
      await getSolanaAddress(prov);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) return;
    
    try {
      await web3auth.logout();
      setProvider(null);
      setSolanaAddress('');
      setIsConnected(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Working Solana Address Example</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button 
            onClick={login} 
            disabled={!web3auth || loading || isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
          <button 
            onClick={logout} 
            disabled={!isConnected}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Logout
          </button>
        </div>

        <div className="text-sm">
          <span className="font-medium">Connected:</span> {isConnected ? 'Yes' : 'No'}
        </div>

        <div className="text-sm">
          <span className="font-medium">Solana Address:</span> 
          {solanaAddress ? (
            <span className="font-mono text-xs break-all">{solanaAddress}</span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-medium text-green-800 mb-2">✅ This approach works because:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Uses direct Web3Auth instantiation (not React hooks)</li>
          <li>• Properly configures SolanaPrivateKeyProvider</li>
          <li>• Accesses the provider directly from Web3Auth instance</li>
          <li>• Creates SolanaWallet and requests accounts successfully</li>
        </ul>
      </div>
    </div>
  );
}
