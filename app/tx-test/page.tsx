"use client"

import { useState } from "react";
import { useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain, useAccount } from "wagmi";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { parseEther } from "viem";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SUPPORTED_CHAINS } from "@/providers/ProfileProvider";

export default function TxTestPage() {
  // Local state for form
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  
  // Wagmi hooks
  const { sendTransaction, isPending, error, data: hash } = useSendTransaction()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isConnected, address } = useAccount()
  const { connect } = useWeb3AuthConnect()

  // Transaction status tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Function to send transaction
  const handleSend = async () => {
    if (!recipient || !amount) return
    
    try {
      await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount)
      })
    } catch (err) {
      console.error("Transaction error:", err)
    }
  }

  // If not connected, show connection button
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wallet Connection Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Connect your wallet to send transactions
            </p>
            <Button onClick={() => connect()} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if on correct chain
  const isCorrectChain = chainId === 84532

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send ETH Transaction</CardTitle>
          <div className="text-sm text-gray-500">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="text-sm text-gray-500">
            Chain: {isCorrectChain ? 'Base Sepolia ✓' : `ID: ${chainId}`}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Alert if wrong chain */}
          {!isCorrectChain && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 mb-2">
                Switch to Base Sepolia to send ETH
              </p>
              <Button 
                onClick={() => switchChain({ chainId: SUPPORTED_CHAINS.BASE_SEPOLIA })}
                variant="outline"
                size="sm"
              >
                Switch to Base Sepolia
              </Button>
            </div>
          )}
          
          {/* Form */}
          <div className="space-y-3">
            <Input 
              placeholder="Recipient Address" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Input
              placeholder="Amount (ETH)"
              type="number"
              step="0.000000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button 
              onClick={handleSend}
              disabled={isPending || !recipient || !amount || !isCorrectChain}
              className="w-full"
            >
              {isPending ? 'Sending...' : 'Send ETH'}
            </Button>
          </div>
          
          {/* Transaction status notifications */}
          {hash && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                Transaction Hash: {hash}
              </p>
            </div>
          )}
          
          {isConfirming && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Waiting for confirmation...
              </p>
            </div>
          )}
          
          {isConfirmed && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                Transaction confirmed successfully!
              </p>
            </div>
          )}
          
          {/* Error messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">
                Error: {error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
