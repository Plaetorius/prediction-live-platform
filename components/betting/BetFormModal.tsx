import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createBetClient } from "@/lib/bets/insertClient"
import { Bet, BetPayload } from "@/lib/types"
import { useBetting } from "@/providers/BettingProvider"
import { SUPPORTED_CHAINS, useProfile } from "@/providers/ProfileProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, useCallback } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { useWaitForTransactionReceipt, useChainId, useSwitchChain, useAccount, useWriteContract } from "wagmi"
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { parseEther, keccak256, toHex } from "viem"
import { BettingPoolABI, BETTING_POOL_ADDRESS } from "@/lib/contracts/BettingPoolABI"
import { createSupabaseClient } from "@/lib/supabase/client"
import { betTxErrorMessages } from "@/lib/errors"
import { validateBettingPrerequisites } from "@/lib/betting/validation"
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
  amount: z.coerce.number().min(1, "Amount is too small! (min: 1)").max(10000000, "Amount is too big! (max: 10,000,000)"),
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
          await switchChain({ chainId: SUPPORTED_CHAINS.CHILIZ_DEV })
        } else {
          toast.error(result.error || "Error placing bet.")
        }
        return
      }

      setTxStep('sending')
            
      try {

        // Appel de la fonction placeBet du smart contract
        await writeContract(result.transactionParams!)
        
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
      console.error("Error placing bet:", error)
      toast.error("An unexpected error occured. Please try again.")
    } finally {
      setLoading(false)
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
    switchChain({ chainId: SUPPORTED_CHAINS.CHILIZ_DEV })
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
          toast.success("Bet placed successfully! Transaction confirmed.")
        
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
          <form onSubmit={form.handleSubmit(onSubmit, onError)}>
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
            {isConnected && chainId !== SUPPORTED_CHAINS.CHILIZ_DEV && (
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
                disabled={loading || !isConnected || chainId !== SUPPORTED_CHAINS.CHILIZ_DEV}
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