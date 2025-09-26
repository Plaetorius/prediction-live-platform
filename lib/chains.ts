import { defineChain } from 'viem'

export const spicy = defineChain({
  id: 88882,
  name: 'Spicy Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Chiliz',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com/'],
      webSocket: ['wss://spicy-rpc-ws.chiliz.com/'],
    },
  },
  blockExplorers: {
    default: { name: 'Chiliscan', url: 'https://testnet.chiliscan.com/' },
  },
  testnet: true,
})

