import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

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
