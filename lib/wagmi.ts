import { createConfig, http } from 'wagmi'
import { chilizTestnet } from './chains'

export const config = createConfig({
  chains: [chilizTestnet],
  transports: {
    [chilizTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
