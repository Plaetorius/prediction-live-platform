import { defineChain } from 'viem'

export const chilizTestnet = defineChain({
  id: 88882,
  name: 'Chiliz Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Chiliz',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com'],
      webSocket: ['wss://spicy-rpc-ws.chiliz.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Chiliz Explorer', url: 'https://testnet.chiliscan.com/' },
  },
  testnet: true,
})

// Keep baseSepolia for backwards compatibility
export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
      webSocket: ['wss://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org/' },
  },
  testnet: true,
})

