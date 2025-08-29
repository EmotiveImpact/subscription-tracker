import { storage } from '@/lib/storage'

export async function canCreateSubscription(): Promise<{ ok: boolean; reason?: string }> {
  const settings = await storage.getSettings()
  const plan = settings.plan ?? 'free'
  if (plan === 'pro') return { ok: true }

  const subs = await storage.getSubscriptions()
  if (subs.length >= 1) {
    return { ok: false, reason: 'Free plan allows only 1 subscription. Upgrade to Pro for unlimited.' }
  }
  return { ok: true }
}
