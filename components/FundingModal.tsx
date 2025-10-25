"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/providers/ProfileProvider'
import { 
  CreditCard, 
  QrCode, 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check,
  Globe,
  Smartphone,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { fiatOnRampService, FiatOnRampConfig } from '@/lib/funding/fiatOnRamp'

interface FundingModalProps {
  children: React.ReactNode
}

export default function FundingModal({ children }: FundingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'qr' | 'transfer' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [userCountry, setUserCountry] = useState<string>('US')
  const { address, profile } = useProfile()

  // Initialize Fiat On-Ramp service
  useEffect(() => {
    const initializeService = async () => {
      if (address) {
        try {
          const country = await fiatOnRampService.getUserCountry()
          setUserCountry(country)
          
          const methods = fiatOnRampService.getSupportedPaymentMethods(country)
          setPaymentMethods(methods)
          
          const config: FiatOnRampConfig = {
            walletAddress: address,
            networkId: 8453, // Base network
            defaultAmount: '100',
            defaultCurrency: 'USD',
            theme: 'dark',
            language: 'en'
          }
          
          await fiatOnRampService.initialize(config)
        } catch (error) {
          console.error('Failed to initialize Fiat On-Ramp service:', error)
        }
      }
    }

    initializeService()
  }, [address])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Address copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openFiatOnRamp = async () => {
    setIsLoading(true)
    try {
      const result = await fiatOnRampService.openFiatOnRamp()
      
      if (result.success) {
        toast.success(`[SIMULATION] Successfully initiated purchase of ${result.amount} ${result.currency}`)
        setIsOpen(false)
      } else {
        toast.error(result.error || 'Payment failed')
      }
    } catch (error) {
      toast.error('Failed to open Fiat On-Ramp')
      console.error('Fiat On-Ramp error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openWalletConnect = () => {
    // This would open WalletConnect for external wallet funding
    toast.info("Wallet Connect integration coming soon!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Funds to Your Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Wallet Address Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Your Wallet Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {address || 'Not connected'}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAddress}
                  disabled={!address}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Send crypto to this address to fund your wallet
              </p>
            </CardContent>
          </Card>

          {/* Funding Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Payment */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'card' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMethod('card')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  Buy with Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Purchase crypto with credit/debit card
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {paymentMethods.slice(0, 4).map((method, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                  {paymentMethods.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{paymentMethods.length - 4} more
                    </Badge>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    openFiatOnRamp()
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Buy Crypto'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'qr' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMethod('qr')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="w-5 h-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Scan QR code with another wallet
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Mobile wallet compatible</span>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.info("QR Code generation coming soon!")
                  }}
                >
                  Generate QR
                </Button>
              </CardContent>
            </Card>

            {/* External Transfer */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedMethod === 'transfer' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMethod('transfer')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ExternalLink className="w-5 h-5" />
                  Transfer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Send from external wallet or exchange
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Any wallet or exchange</span>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    openWalletConnect()
                  }}
                >
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Network Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported Networks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  'Ethereum', 'Base', 'Polygon', 'Arbitrum',
                  'Optimism', 'Avalanche', 'BSC', 'Solana'
                ].map((network) => (
                  <Badge key={network} variant="outline" className="text-xs">
                    {network}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Send funds on any supported network. Your balance will be displayed in ETH equivalent.
              </p>
            </CardContent>
          </Card>

          {/* Payment Methods Coverage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Available Payment Methods ({userCountry})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{method}</span>
                    <Badge variant="secondary" className="text-xs">Available</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Global Coverage</span>
                  <Badge variant="outline">50+ Countries</Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Local Methods</span>
                  <Badge variant="outline">100+ Methods</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
