/**
 * Dev stub for the Founding Broker waitlist.
 * Returns a numbered position; production uses the Azure Functions app
 * (UAE North) with durable storage and real referral mechanics.
 */
// Display offset so the first signups don't read "#1". Arbitrary — the team
// should decide whether to use a real count or drop the offset entirely.
const WAITLIST_SEED = 0

const entries: Record<string, unknown>[] = []

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.name || !body?.whatsapp) {
    throw createError({ statusCode: 400, statusMessage: 'name and whatsapp are required' })
  }

  entries.push({ ...body, receivedAt: new Date().toISOString() })
  const position = WAITLIST_SEED + entries.length
  console.log(`[waitlist stub] position ${position}:`, body)

  return {
    ok: true,
    position,
    referralCode: `RB-${position.toString(36).toUpperCase()}`
  }
})
