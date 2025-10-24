import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { BetPayload } from "@/lib/types"
import { useBetting } from "@/providers/BettingProvider"
import { SUPPORTED_CHAINS, useProfile } from "@/providers/ProfileProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, useCallback } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { useWaitForTransactionReceipt, useChainId, useSwitchChain, useAccount, useWriteContract, useCall } from "wagmi"
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { createBetPayload, handleTransactionError, processBettingRequest } from "@/lib/betting/bettingService"
import { mapBetSupaToTS } from "@/lib/mappings"

interface BetFormModalProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  marketId: string | null
  isAnswerA: boolean
  teamName: string
}

const betFormSchema = z.object({
  amount: z.coerce.number().min(0.001, "Amount is too small! (min: 0.001 ETH)").max(100, "Amount is too big! (max: 100 ETH)"),
})

type BetFormSchema = z.infer<typeof betFormSchema>

export default function BetFormModal({
  isModalOpen,
  setIsModalOpen,
  marketId,
  isAnswerA,
  teamName
}: BetFormModalProps) {
  const { profile, setConfirmedBets } = useProfile()
  const [loading, setLoading] = useState<boolean>(false)
  const [txStep, setTxStep] = useState<'idle' | 'sending' | 'confirming' | 'confirmed' | 'error'>('idle')

  // Web3 hooks
  const { writeContract, error: txError, data: txHash } = useWriteContract()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isConnected, address } = useAccount()
  const { connect } = useWeb3AuthConnect()

  // Transaction status tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  }) 
  const { sendBetTeam1, sendBetTeam2 } = useBetting() 

  const form = useForm({
    resolver: zodResolver(betFormSchema),
    defaultValues: {
      amount: 1
    }
  })

  const [pendingBetPayload, setPendingBetPayload] = useState<BetPayload | null>(null)
  const updateBetStatus = useCallback(async (betId: string, status: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('bets')
        .update({ status })
        .eq('id', betId)
        .select()
        .single()
      return mapBetSupaToTS(data)
    } catch (error) {
      console.error("Error updating bet status:", error)
    }
  }, [])

  const onSubmit: SubmitHandler<BetFormSchema> = useCallback(async (data) => {
    try {
      if (!profile) return

      setLoading(true)
      setTxStep('idle')

      const result = await processBettingRequest({
        marketId,
        profileId: profile.id,
        isAnswerA,
        amount: data.amount,
        profile,
        isConnected,
        chainId,
        account: address || null
      })


      if (!result.success) {
        if (result.requiresAction === 'connect') {
          await connect()
        } else if (result.requiresAction === 'switchChain') {
          await switchChain({ chainId: SUPPORTED_CHAINS.BASE_SEPOLIA })
        } else {
          toast.error(result.error || "Error placing bet.")
        }
        setLoading(false)
        return
      }

      setTxStep('sending')
            
      try {
        await writeContract({
          address: result.transactionParams!.address,
          abi: result.transactionParams!.abi,
          functionName: result.transactionParams!.functionName,
          args: result.transactionParams!.args,
          value: result.transactionParams!.value,
        } as any)
        
        setTxStep('confirming')
        toast.info("Transaction sent! Waiting for confirmation...")

        setPendingBetPayload(createBetPayload(
          marketId!,
          profile.id,
          data.amount,
          result.bet!.createdAt.toISOString(),
          result.bet!.id,
          isAnswerA
        ))

      } catch (writeContractError) {
        setTxStep('error')
        setLoading(false)
        console.error("Transaction failed:", writeContractError)
        

        const errorHandling = handleTransactionError(writeContractError, null)
        toast.error(`Transaction failed: ${errorHandling.userMessage}`)

        if (errorHandling.shouldUpdateBetStatus) {
          await updateBetStatus(result.bet!.id, 'error')
        }
        return
      }

    } catch (error) {
      setTxStep('error')
      setLoading(false)
      console.error("Error placing bet:", error)
      toast.error("An unexpected error occured. Please try again.")
    }
  }, [marketId, profile, isConnected, chainId, connect, switchChain, writeContract, isAnswerA, updateBetStatus])

  const onError = (errors: Record<string, { message?: string }>) => {
    console.error("Form validation errors:", errors)

    const firstError = Object.values(errors)[0]
    if (firstError?.message) {
      toast.error(firstError.message)
    } else {
      toast.error("Please check your input and try again.")
    }
  }

  const handleConnect = useCallback(() => {
    connect()
  }, [connect])

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: SUPPORTED_CHAINS.BASE_SEPOLIA })
  }, [switchChain])

  useEffect(() => {
    const confirmBet = async () => {
      if (isConfirming) {
        setTxStep('confirming')
        return
      }

      if (isConfirmed && txStep !== 'confirmed' && pendingBetPayload) {
        try {
          setTxStep('confirmed')
          setLoading(false)
          toast.success("Prediction placed successfully! Transaction confirmed.")
        
          const betPayload: BetPayload = {
            marketId: pendingBetPayload.marketId,
            profileId: pendingBetPayload.profileId,
            amount: pendingBetPayload.amount,
            createdAt: pendingBetPayload.createdAt,
            betId: pendingBetPayload.betId,
            isAnswerA: pendingBetPayload.isAnswerA,
          }

          if (pendingBetPayload.isAnswerA) {
            sendBetTeam1(betPayload)
          } else {
            sendBetTeam2(betPayload)
          }

          const bet = await updateBetStatus(pendingBetPayload.betId, 'confirmed')

          if (bet) {
            setConfirmedBets((prev) => {
              const newMap = new Map(prev)
              newMap.set(bet.marketId, bet)
              return newMap
            })
          }

          setPendingBetPayload(null)
          setIsModalOpen(false)
        } catch (error) {
          console.error("Error confirming bet:", error)
          toast.error("Error confirming bet. Please check your bets.")
          setLoading(false)
        }
      }

      if (txError) {
        setTxStep('error')
        setLoading(false)
        
        const errorHandling = handleTransactionError(txError, pendingBetPayload)
        toast.error(`Transaction failed; ${errorHandling.userMessage}`)

        if (pendingBetPayload && errorHandling.shouldUpdateBetStatus) {
          await updateBetStatus(pendingBetPayload.betId, 'error');
          setPendingBetPayload(null);
        }
      }
    }

    confirmBet()
  }, [isConfirming, isConfirmed, txError, pendingBetPayload, sendBetTeam1, sendBetTeam2, updateBetStatus])

  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        amount: 1,
      })
    }
  }, [isModalOpen])

  const resetModalState = useCallback(() => {
    setLoading(false)
    setTxStep('idle')
    setPendingBetPayload(null)
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      form.reset({
        amount: 1,
      })
      resetModalState()
    }
  }, [isModalOpen, resetModalState])

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className={`w-full ${isAnswerA ? "bg-brand-pink" : "bg-brand-cyan" }`}>
          {teamName}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Prediction creation
          </DialogTitle>
          <DialogDescription>
            Place a bet for <span className='font-semibold'>{teamName}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount (ETH)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type='number'
                      min="0.001"
                      step="0.001"
                      placeholder="Enter the amount to bet..."
                      {...field}
                      value={field.value?.toString() || ''}
                    />
                  </FormControl>
                  <FormMessage />
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
            {isConnected && chainId !== SUPPORTED_CHAINS.BASE_SEPOLIA && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  Please switch to Base Sepolia to place bets
                </p>
                <Button 
                  onClick={handleSwitchChain} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Switch to Base Sepolia
                </Button>
              </div>
            )}

            {/* Transaction status */}
            {txHash && (
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl mb-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-200">
                      Transaction submitted
                    </p>
                    <p className="text-xs text-blue-300/70 font-mono">
                      {txHash.slice(0, 8)}...{txHash.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {txStep === 'confirming' && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl mb-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-200">
                      Confirming transaction...
                    </p>
                    <p className="text-xs text-amber-300/70">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </div>
            )}

            {txStep === 'confirmed' && (
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl mb-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-200">
                      Prediction placed successfully!
                    </p>
                    <p className="text-xs text-green-300/70">
                      Your prediction is now active
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type='submit'
                disabled={
                  loading || 
                  !isConnected || 
                  chainId !== SUPPORTED_CHAINS.BASE_SEPOLIA ||
                  txStep === "sending" ||
                  txStep === "confirming" ||
                  !!txHash
                }
                className="flex-1"
              >
                {(() => {
                  if (txStep === 'sending') return "Sending transaction..."
                  if (txStep === 'confirming') return "Confirming..."
                  if (txStep === 'confirmed') return "Prediction Placed!"
                  if (txStep === 'error') return "Retry"
                  if (loading) return "Placing bet..."
                  return "Place Prediction"
                })()}
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