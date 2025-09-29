import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createBetClient } from "@/lib/bets/insertClient"
import { BetPayload } from "@/lib/types"
import { useBetting } from "@/providers/BettingProvider"
import { useProfile } from "@/providers/ProfileProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

interface BetFormModalProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  marketId: string | null
  isAnswerA: boolean
  teamName: string
}

const betFormSchema = z.object({
  amount: z.number().min(1, "Amount is too small! (min: 1)").max(10000000, "Amount is too big! (max: 10,000,000)"),
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
  const { sendBetTeam1, sendBetTeam2 } = useBetting() 

  const form = useForm({
    resolver: zodResolver(betFormSchema),
    defaultValues: {
      amount: 1
    }
  })


  const onSubmit: SubmitHandler<BetFormSchema> = async (data) => {
    if (!marketId || !profile) {
      console.error("Error placing bet:", marketId ? "" : "No marketId", profile ? "" : "No profile")
      toast.error("Error placing bet.")
      return null
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
    setLoading(false)
    toast.success("Bet placed successfully!")
    
  }

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
                      placeholder="Enter the amount to bet..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-4">
              <Button
                type='submit'
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Placing bet..." : "Place Bet"}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModalOpen(false)}
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