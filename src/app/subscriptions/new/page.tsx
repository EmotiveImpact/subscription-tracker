"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSubscriptions } from '@/hooks/use-subscriptions'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1),
  cycle: z.enum(['monthly', 'yearly', 'weekly', 'quarterly']),
  nextBillingAt: z.string().min(1),
  category: z.string().optional(),
  notes: z.string().optional(),
})

export default function NewSubscriptionPage() {
  const router = useRouter()
  const { createSubscription } = useSubscriptions()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(formData: FormData) {
    setErrors({})
    setLoading(true)
    const values = Object.fromEntries(formData.entries()) as Record<string, string>
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => {
        const path = i.path[0] as string
        fieldErrors[path] = i.message
      })
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    try {
      await createSubscription({
        id: "", // omitted by type
        merchantId: "manual",
        merchantName: parsed.data.merchantName,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        cycle: parsed.data.cycle,
        nextBillingAt: parsed.data.nextBillingAt,
        status: 'active',
        source: 'manual',
        category: parsed.data.category,
        notes: parsed.data.notes,
        createdAt: '',
        updatedAt: '',
      } as any)
      toast({ title: 'Subscription added' })
      router.push('/subscriptions')
    } catch (e) {
      toast({ title: 'Failed to add subscription', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Subscription</CardTitle>
          <CardDescription>Manually add a recurring subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="merchantName">Merchant</Label>
              <Input id="merchantName" name="merchantName" placeholder="Netflix" />
              {errors.merchantName && <p className="text-sm text-destructive">{errors.merchantName}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" placeholder="15.99" />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select name="currency" defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Billing Cycle</Label>
                <Select name="cycle" defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue placeholder="Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextBillingAt">Next Billing Date</Label>
                <Input id="nextBillingAt" name="nextBillingAt" type="date" />
                {errors.nextBillingAt && <p className="text-sm text-destructive">{errors.nextBillingAt}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="Entertainment" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="e.g., Standard plan" />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Subscription'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
