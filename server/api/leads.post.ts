/**
 * Dev stub for the "Upload your project" lead form.
 * Production traffic goes to the Azure Functions app (UAE North) instead —
 * the frontend switches via runtimeConfig.public.apiBase.
 */
const leads: Record<string, unknown>[] = []

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.name || !body?.contact || !body?.project) {
    throw createError({ statusCode: 400, statusMessage: 'name, contact and project are required' })
  }

  leads.push({ ...body, receivedAt: new Date().toISOString() })
  console.log(`[leads stub] #${leads.length}:`, body)

  return { ok: true }
})
