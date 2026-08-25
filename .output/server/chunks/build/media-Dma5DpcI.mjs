import { _ as __nuxt_component_0 } from './PersonaHero-C6iJKIID.mjs';
import { _ as __nuxt_component_2 } from './PressStrip-F9GuthzB.mjs';
import { defineComponent, withCtx, createVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, g as useTrack } from './server.mjs';
import { u as useHead } from './v3-CGN8Ffpm.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "media",
  __ssrInlineRender: true,
  setup(__props) {
    const { track } = useTrack();
    useHead({
      title: "Rechitta \u2014 Press & Media",
      meta: [
        {
          name: "description",
          content: "Press resources for Rechitta, the AI briefing layer for Dubai off-plan real estate. 52 placements across English and Arabic media in May 2026."
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PersonaHero = __nuxt_component_0;
      const _component_PressStrip = __nuxt_component_2;
      _push(`<main${ssrRenderAttrs(_attrs)} data-v-07da560a>`);
      _push(ssrRenderComponent(_component_PersonaHero, {
        eyebrow: "PRESS & MEDIA",
        title: "Rechitta, in the press.",
        subtitle: "52 placements across English and Arabic media in May 2026 \u2014 including Khaleej Times, Zawya, Gulf Today, Al Bayan, Dubai Eye 103.8, and the cover of Property Times."
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<a href="mailto:aryaman@rechitta.com?subject=Press%20enquiry" class="btn btn-primary" data-v-07da560a${_scopeId}> Press enquiries </a>`);
          } else {
            return [
              createVNode("a", {
                href: "mailto:aryaman@rechitta.com?subject=Press%20enquiry",
                class: "btn btn-primary",
                onClick: ($event) => unref(track)("cta:press_contact_click", { placement: "media_hero" })
              }, " Press enquiries ", 8, ["onClick"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_PressStrip, null, null, _parent));
      _push(`<section class="section boilerplate" data-v-07da560a><p class="eyebrow" data-v-07da560a>BOILERPLATE</p><p class="body" data-v-07da560a> Rechitta is an AI platform for Dubai&#39;s off-plan real estate market. Developers put their projects on Rechitta; brokers get an AI agent that knows the live inventory and generates branded property briefings for buyers \u2014 in the buyer&#39;s language, by voice or text. Rechitta is live with real developments in Dubai. </p><p class="body" data-v-07da560a> Brand assets (logo, founder photos, product imagery) are available on request via the press contact above. </p></section></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/media.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const media = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-07da560a"]]);

export { media as default };
//# sourceMappingURL=media-Dma5DpcI.mjs.map
