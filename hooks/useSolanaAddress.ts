'use client';

import { useEffect, useState, useRef } from 'react';
import { Web3Auth, type Web3AuthOptions, WEB3AUTH_NETWORK } from '@web3auth/modal';
import { useWeb3AuthConnect, useWeb3AuthUser } from '@web3auth/modal/react';

interface UseSolanaAddressReturn {
  solanaAddress: string;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Custom hook to reliably get Solana address using the working method from WorkingSolanaExample
 * This uses direct Web3Auth instantiation instead of React hooks for better reliability
 */
export function useSolanaAddress(): UseSolanaAddressReturn {
  const [solanaAddress, setSolanaAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  
  // Use Web3Auth React hooks to monitor connection state
  const { isConnected: web3AuthConnected } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  
  // Keep track of previous connection state to detect changes
  const prevConnectedRef = useRef(false);
  const prevUserInfoRef = useRef<any>(null);

  // Initialize Web3Auth instance
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Configure Web3AuthOptions for Solana
        const options: Web3AuthOptions = {
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        };

        // Create modal instance and init
        const w3a = new Web3Auth(options);
        await w3a.init();
        setWeb3auth(w3a);

        if (w3a.provider) {
          await getSolanaAddress(w3a.provider, w3a);
        }
      } catch (error) {
        console.error('Web3Auth initialization failed:', error);
        setError('Failed to initialize Web3Auth');
      } finally {
        setIsLoading(false);
      }
    };

    initWeb3Auth();
  }, []);

  // Monitor connection state changes and user info changes
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (!web3auth) return;

      // Check if connection state changed
      const connectionChanged = prevConnectedRef.current !== web3AuthConnected;
      const userInfoChanged = JSON.stringify(prevUserInfoRef.current) !== JSON.stringify(userInfo);

      if (connectionChanged || userInfoChanged) {
        console.log('Connection or user info changed:', { 
          connectionChanged, 
          userInfoChanged, 
          web3AuthConnected,
          userInfo 
        });

        if (web3AuthConnected && web3auth.provider) {
          // User connected - get Solana address
          await getSolanaAddress(web3auth.provider, web3auth);
        } else {
          // User disconnected - clear Solana address
          setSolanaAddress('');
          setIsConnected(false);
          setError(null);
        }

        // Update refs
        prevConnectedRef.current = web3AuthConnected;
        prevUserInfoRef.current = userInfo;
      }
    };

    handleConnectionChange();
  }, [web3AuthConnected, userInfo, web3auth]);

  const getSolanaAddress = async (provider: any, web3authInstance: Web3Auth) => {
    try {
      console.log('Provider:', provider);
      console.log('Provider methods:', Object.getOwnPropertyNames(provider));
      console.log('Provider prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(provider)));
      
      // Try to get user info first
      try {
        const userInfo = await web3authInstance.getUserInfo();
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
        console.log('No accounts found');
        setSolanaAddress('');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to get Solana address:', error);
      setError('Failed to get Solana address');
      setSolanaAddress('');
      setIsConnected(false);
    }
  };

  return {
    solanaAddress,
    isLoading,
    error,
    isConnected
  };
}
