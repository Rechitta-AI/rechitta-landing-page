import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const WAITLIST_SEED = 0;
const entries = [];
const waitlist_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.name) || !(body == null ? void 0 : body.whatsapp)) {
    throw createError({ statusCode: 400, statusMessage: "name and whatsapp are required" });
  }
  entries.push({ ...body, receivedAt: (/* @__PURE__ */ new Date()).toISOString() });
  const position = WAITLIST_SEED + entries.length;
  console.log(`[waitlist stub] position ${position}:`, body);
  return {
    ok: true,
    position,
    referralCode: `RB-${position.toString(36).toUpperCase()}`
  };
});

export { waitlist_post as default };
//# sourceMappingURL=waitlist.post.mjs.map
