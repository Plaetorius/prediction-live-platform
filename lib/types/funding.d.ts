/**
 * Type definitions for MetaMask SDK and funding services
 */

declare global {
  interface Window {
    metamask?: {
      sdk: any
      isMetaMask: boolean
    }
  }
}

export interface MetaMaskSDK {
  isConnected: boolean
  isInitialized: boolean
  connect: () => Promise<any>
  disconnect: () => Promise<void>
  request: (params: any) => Promise<any>
}

export interface FiatOnRampProvider {
  name: string
  supportedCountries: string[]
  supportedCurrencies: string[]
  supportedNetworks: number[]
  minAmount: number
  maxAmount: number
  fees: {
    percentage: number
    fixed: number
  }
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'bank' | 'wallet' | 'local'
  supportedCountries: string[]
  fees: {
    percentage: number
    fixed: number
  }
  processingTime: string
}

export interface NetworkInfo {
  id: number
  name: string
  symbol: string
  rpcUrl: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface FundingTransaction {
  id: string
  amount: string
  currency: string
  network: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: number
  hash?: string
  fromAddress?: string
  toAddress: string
}

export interface CountryInfo {
  code: string
  name: string
  currency: string
  paymentMethods: string[]
  supportedNetworks: number[]
}

export interface UserLocation {
  country: string
  region: string
  city: string
  timezone: string
  currency: string
}
