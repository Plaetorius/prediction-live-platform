"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfile } from '@/providers/ProfileProvider'
import { useWeb3Auth } from '@web3auth/modal/react'
import {
  CreditCard,
  QrCode,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface FundingModalProps {
  children: React.ReactNode
}

export default function FundingModal({ children }: FundingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { address, profile } = useProfile()
  const web3auth = useWeb3Auth()

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Address copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openWeb3AuthWalletServices = async () => {
    if (!web3auth) {
      toast.error('Web3Auth not initialized')
      return
    }

    setIsLoading(true)
    try {
      // Web3Auth Wallet Services are available via the floating widget
      // The widget should be visible when walletServicesConfig is properly configured
      toast.info('Wallet Services widget should be visible in the bottom-right corner!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to access Wallet Services')
      console.error('Web3Auth Wallet Services error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openWalletConnect = () => {
    toast.info("Wallet Connect integration coming soon!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Funds to Your Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Web3Auth Wallet Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Web3Auth Wallet Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-4">
                Access the full Web3Auth Wallet Services interface with integrated Fiat On-Ramp, 
                token swaps, and wallet management features.
              </p>
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={openWeb3AuthWalletServices}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening Wallet Services...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Open Wallet Services
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Wallet Address Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Your Wallet Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-brand-black-3 border border-brand-gray-2 rounded-lg">
                <code className="flex-1 text-sm font-mono break-all text-white">
                  {address || 'Not connected'}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyAddress}
                  disabled={!address}
                  className="border-brand-gray-2 hover:bg-brand-purple/20"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Send crypto to this address to fund your wallet
              </p>
            </CardContent>
          </Card>

          {/* Alternative Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alternative Funding Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-brand-black-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm">QR Code Transfer</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toast.info("QR Code generation coming soon!")}
                  >
                    Generate
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-black-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">External Wallet</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openWalletConnect}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}