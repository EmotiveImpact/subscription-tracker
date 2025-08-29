type SendSmsParams = {
  to: string
  body: string
}

const TWILIO_ENABLED = process.env.NEXT_PUBLIC_TWILIO_ENABLED === 'true'

let client: any = null

function getClient() {
  if (!TWILIO_ENABLED) return null
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  if (!sid || !token || !messagingServiceSid) return null
  // Dynamically import to avoid bundling in client
  // Note: keep this server-only; do not call from client components
  // eslint-disable-next-line no-new-func
  const load = new Function('m', "return import(m)")
  return load('twilio').then((mod: any) => {
    client = client || mod.default(sid, token)
    return { client, messagingServiceSid }
  })
}

export async function sendSms({ to, body }: SendSmsParams): Promise<{ ok: boolean; id?: string; reason?: string }> {
  try {
    const ctx = await getClient()
    if (!ctx) {
      return { ok: false, reason: 'SMS disabled or misconfigured' }
    }
    const res = await ctx.client.messages.create({
      to,
      messagingServiceSid: ctx.messagingServiceSid,
      body,
    })
    return { ok: true, id: res.sid }
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Failed to send SMS' }
  }
}
