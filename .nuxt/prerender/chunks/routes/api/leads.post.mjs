import { defineEventHandler, readBody, createError } from 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/h3/dist/index.mjs';

const leads = [];
const leads_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.name) || !(body == null ? void 0 : body.contact) || !(body == null ? void 0 : body.project)) {
    throw createError({ statusCode: 400, statusMessage: "name, contact and project are required" });
  }
  leads.push({ ...body, receivedAt: (/* @__PURE__ */ new Date()).toISOString() });
  console.log(`[leads stub] #${leads.length}:`, body);
  return { ok: true };
});

export { leads_post as default };
//# sourceMappingURL=leads.post.mjs.map
