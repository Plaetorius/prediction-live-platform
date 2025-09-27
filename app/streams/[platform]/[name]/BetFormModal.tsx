import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createBetClient } from "@/lib/bets/insertClient"
import { createSupabaseClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, useCallback } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain, useAccount } from "wagmi"
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { parseEther } from "viem"

interface BetFormModalProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  marketId: string | null
  profileId: string | null
  isAnswerA: boolean
  teamName: string
}

const betFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount is too small! (min: 1)").max(10000000, "Amount is too big! (max: 10,000,000)"),
})

type BetFormSchema = z.infer<typeof betFormSchema>

export default function BetFormModal({
  isModalOpen,
  setIsModalOpen,
  marketId,
  profileId,
  isAnswerA,
  teamName
}: BetFormModalProps) {
  const [loading, setLoading] = useState<boolean>(false)
  const [txStep, setTxStep] = useState<'idle' | 'sending' | 'confirming' | 'confirmed' | 'error'>('idle')

  // Web3 hooks
  const { sendTransaction, isPending: isTxPending, error: txError, data: txHash } = useSendTransaction()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isConnected, address } = useAccount()
  const { connect } = useWeb3AuthConnect()

  // Transaction status tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const form = useForm({
    resolver: zodResolver(betFormSchema),
    defaultValues: {
      amount: 1
    }
  })

  const onSubmit: SubmitHandler<BetFormSchema> = useCallback(async (data) => {
    if (!marketId || !profileId) {
      toast.error("Error placing bet.")
      return null
    }

    // Check if wallet is connected
    if (!isConnected) {
      toast.error("Please connect your wallet first.")
      await connect()
      return
    }

    // Check if on correct chain (Spicy Testnet)
    if (chainId !== 88882) {
      toast.error("Please switch to Spicy Testnet.")
      await switchChain({ chainId: 88882 })
      return
    }

    setLoading(true)
    setTxStep('sending')

    try {
      // First create the bet in database
      const bet = await createBetClient(
        marketId,
        '6c5b0e03-5ba0-447c-a495-aea397fba8f9',
        isAnswerA,
        data.amount,
        'draft'
      )
      
      if (!bet) {
        toast.error('Error placing bet. Please try again.')
        setLoading(false)
        setTxStep('error')
        return
      }

      // Send CHZ transaction to the specified address
      await sendTransaction({
        to: "0x2D4Ec5dd34bCaff6c1998575763E12597092A044" as `0x${string}`,
        value: parseEther(data.amount.toString())
      })

      setTxStep('confirming')
      toast.info("Transaction sent! Waiting for confirmation...")
      
    } catch (err) {
      console.error("Transaction error:", err)
      toast.error("Transaction failed. Please try again.")
      setTxStep('error')
      setLoading(false)
    }
  }, [marketId, profileId, isConnected, chainId, connect, switchChain, sendTransaction, isAnswerA])

  // Stable callbacks
  const handleConnect = useCallback(() => {
    connect()
  }, [connect])

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: 88882 })
  }, [switchChain])

  // Handle transaction status changes
  useEffect(() => {
    if (isConfirming) {
      setTxStep('confirming')
    }
    if (isConfirmed) {
      setTxStep('confirmed')
      setLoading(false)
      toast.success("Bet placed successfully! Transaction confirmed.")
      setIsModalOpen(false)
    }
    if (txError) {
      setTxStep('error')
      setLoading(false)
      toast.error(`Transaction failed: ${txError.message}`)
    }
  }, [isConfirming, isConfirmed, txError])

  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        amount: 1,
      })
    }
  }, [isModalOpen, form, marketId, profileId, isAnswerA, teamName])

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant='default'>
          {teamName}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Bet creation
          </DialogTitle>
          <DialogDescription>
            Place a bet for <span className='font-semibold'>{teamName}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type='number'
                      step="0.01"
                      min="1"
                      placeholder="Enter the amount to bet..."
                      value={field.value?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Wallet connection status */}
            {!isConnected && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  Please connect your wallet to place a bet
                </p>
                <Button 
                  onClick={handleConnect} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Connect Wallet
                </Button>
              </div>
            )}

            {/* Chain status */}
            {isConnected && chainId !== 88882 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  Please switch to Spicy Testnet to place bets
                </p>
                <Button 
                  onClick={handleSwitchChain} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Switch to Spicy Testnet
                </Button>
              </div>
            )}

            {/* Transaction status */}
            {txHash && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                <p className="text-sm text-blue-800">
                  Transaction Hash: {txHash}
                </p>
              </div>
            )}

            {txStep === 'confirming' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  Waiting for transaction confirmation...
                </p>
              </div>
            )}

            {txStep === 'confirmed' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
                <p className="text-sm text-green-800">
                  Transaction confirmed! Bet placed successfully.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type='submit'
                disabled={loading || !isConnected || chainId !== 88882}
                className="flex-1"
              >
                {loading ? (
                  txStep === 'sending' ? "Sending transaction..." :
                  txStep === 'confirming' ? "Confirming..." :
                  "Placing bet..."
                ) : "Place Bet"}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}