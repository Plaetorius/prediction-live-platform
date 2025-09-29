import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createBetClient } from "@/lib/bets/insertClient"
import { BetPayload } from "@/lib/types"
import { useBetting } from "@/providers/BettingProvider"
import { SUPPORTED_CHAINS, useProfile } from "@/providers/ProfileProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, useCallback } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import { useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain, useAccount, useWriteContract } from "wagmi"
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { parseEther, keccak256, toHex } from "viem"
import { BettingPoolABI, BETTING_POOL_ADDRESS } from "@/lib/contracts/BettingPoolABI"

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
  const { profile } = useProfile()
  const [loading, setLoading] = useState<boolean>(false)
  const [txStep, setTxStep] = useState<'idle' | 'sending' | 'confirming' | 'confirmed' | 'error'>('idle')

  // Web3 hooks
  const { writeContract, isPending: isTxPending, error: txError, data: txHash } = useWriteContract()
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


  const onSubmit: SubmitHandler<BetFormSchema> = useCallback(async (data) => {
    try {
      if (!marketId) {
        console.error("Couldn't find market with marketId:", marketId)
        toast.error("Error placing bet.")
        return null
      }

      if(!profile) {
        console.error("Couldn't find profile:", profile)
        toast.error("Error placing bet.")
        return null
      }

      if (!isConnected) {
        console.error("Wallet is not connected.")
        toast.error("Please connect your wallet first.")
        await connect()
        return
      }

      if (chainId !== SUPPORTED_CHAINS.CHILIZ_DEV) {
        toast.error("Switching to the Spicy Testnet")
        await switchChain({ chainId: SUPPORTED_CHAINS.CHILIZ_DEV })
        return
      }

      setLoading(true)

      const bet = await createBetClient(
        marketId,
        profile.id,
        isAnswerA,
        data.amount,
        'draft'
      )
      if (!bet) {
        console.error("Error placing bet:", bet)
        toast.error('Error placing bet. Please try again.')
        return
      }

      setTxStep('sending')
      
      // Convertir le marketId (UUID) en poolId numérique
      const poolId = BigInt(keccak256(toHex(marketId)).slice(0, 10)) // Prendre les 8 premiers caractères du hash
      
      // Appel de la fonction placeBet du smart contract
      await writeContract({
        address: BETTING_POOL_ADDRESS,
        abi: BettingPoolABI,
        functionName: "placeBet",
        args: [
          poolId, // PoolId généré à partir du marketId
          isAnswerA ? 0 : 1 // 0 = BetSide.A, 1 = BetSide.B
        ],
        value: parseEther(data.amount.toString())
      })

      setTxStep('confirming')
      toast.info("Transaction sent! Waiting for confirmation...")

      const betPayload: BetPayload = {
        marketId,
        profileId: profile.id,
        amount: data.amount,
        createdAt: bet.createdAt.toISOString(),
        betId: bet.id,
      }
      if (isAnswerA) {
        sendBetTeam1(betPayload)
      } else {
        sendBetTeam2(betPayload)
      }
      // TODO TX starts here
      toast.success("Bet placed successfully!")
    } catch (error) {
      setTxStep('error')
      console.error("Error placing bet:", error)
      toast.error("An unexpected error occured. Please try again.")
    } finally {
      setLoading(false)
    } 
  }, [marketId, profile, isConnected, chainId, connect, switchChain, writeContract, isAnswerA])

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors)

    const firstError = Object.values(errors)[0] as any
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
  }, [isModalOpen, form, marketId, profile, isAnswerA, teamName])

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