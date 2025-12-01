/**
 * MetaMask Fiat On-Ramp Integration
 * This service handles the integration with MetaMask's Fiat On-Ramp Aggregator
 */

export interface FiatOnRampConfig {
  // MetaMask configuration
  sdkUrl?: string
  apiKey?: string
  
  // User configuration
  walletAddress: string
  networkId?: number
  defaultAmount?: string
  defaultCurrency?: string
  
  // UI configuration
  theme?: 'light' | 'dark'
  language?: string
}

export interface FiatOnRampResult {
  success: boolean
  transactionId?: string
  amount?: string
  currency?: string
  error?: string
}

class FiatOnRampService {
  private config: FiatOnRampConfig | null = null
  private isInitialized = false

  /**
   * Initialize the Fiat On-Ramp service
   */
  async initialize(config: FiatOnRampConfig): Promise<void> {
    this.config = config
    this.isInitialized = true
    
    // Load MetaMask SDK if not already loaded
    if (typeof window !== 'undefined' && !window.metamask) {
      await this.loadMetaMaskSDK()
    }
  }

  /**
   * Load MetaMask SDK dynamically
   */
  private async loadMetaMaskSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = this.config?.sdkUrl || 'https://sdk.metamask.io/0.2.0/metamask-sdk.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load MetaMask SDK'))
      document.head.appendChild(script)
    })
  }

  /**
   * Open Fiat On-Ramp modal
   */
  async openFiatOnRamp(): Promise<FiatOnRampResult> {
    if (!this.isInitialized || !this.config) {
      throw new Error('Fiat On-Ramp service not initialized')
    }

    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        // Use simulation for development
        const result = await this.simulateFiatOnRamp()
        return result
      } else {
        // Use real MetaMask Fiat On-Ramp in production
        const result = await this.realFiatOnRamp()
        return result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Real MetaMask Fiat On-Ramp integration
   */
  private async realFiatOnRamp(): Promise<FiatOnRampResult> {
    try {
      // This would integrate with MetaMask's actual Fiat On-Ramp API
      // For now, we'll show a message that real integration is needed
      throw new Error('Real MetaMask Fiat On-Ramp integration not implemented yet. This requires MetaMask SDK setup and API keys.')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fiat On-Ramp integration not available'
      }
    }
  }

  /**
   * Simulate Fiat On-Ramp (for development)
   * In production, this would integrate with MetaMask's actual service
   */
  private async simulateFiatOnRamp(): Promise<FiatOnRampResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate success/failure
    const success = Math.random() > 0.1 // 90% success rate
    
    if (success) {
      return {
        success: true,
        transactionId: `tx_${Date.now()}`,
        amount: this.config?.defaultAmount || '100',
        currency: this.config?.defaultCurrency || 'USD'
      }
    } else {
      return {
        success: false,
        error: 'Payment failed. Please try again.'
      }
    }
  }

  /**
   * Get supported payment methods for a country
   */
  getSupportedPaymentMethods(countryCode: string): string[] {
    const paymentMethods: Record<string, string[]> = {
      'US': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer'],
      'GB': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer'],
      'DE': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'SEPA'],
      'FR': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'SEPA'],
      'CA': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
      'AU': ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer'],
      'JP': ['Credit Card', 'Debit Card', 'Google Pay', 'Bank Transfer'],
      'KR': ['Credit Card', 'Debit Card', 'Google Pay'],
      'BR': ['Credit Card', 'Debit Card', 'PIX', 'Boleto'],
      'MX': ['Credit Card', 'Debit Card', 'OXXO'],
      'IN': ['Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'],
      'CN': ['Credit Card', 'Debit Card', 'Alipay', 'WeChat Pay'],
      'SG': ['Credit Card', 'Debit Card', 'Google Pay', 'PayNow'],
      'TH': ['Credit Card', 'Debit Card', 'PromptPay'],
      'ID': ['Credit Card', 'Debit Card', 'Bank Transfer', 'OVO', 'DANA'],
      'PH': ['Credit Card', 'Debit Card', 'GCash', 'GrabPay'],
      'VN': ['Credit Card', 'Debit Card', 'Momo', 'VietQR'],
      'MY': ['Credit Card', 'Debit Card', 'FPX', 'Boost', 'GrabPay'],
      'NG': ['Credit Card', 'Debit Card', 'Bank Transfer'],
      'ZA': ['Credit Card', 'Debit Card', 'Bank Transfer'],
    }

    return paymentMethods[countryCode] || ['Credit Card', 'Debit Card']
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): Array<{id: number, name: string, symbol: string}> {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
      { id: 56, name: 'BSC', symbol: 'BNB' },
      { id: 101, name: 'Solana', symbol: 'SOL' },
    ]
  }

  /**
   * Get user's country (simplified)
   */
  async getUserCountry(): Promise<string> {
    try {
      // In a real implementation, you might use a geolocation service
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return data.country_code || 'US'
    } catch {
      return 'US' // Default fallback
    }
  }
}

// Export singleton instance
export const fiatOnRampService = new FiatOnRampService()

// Export types are already exported above
