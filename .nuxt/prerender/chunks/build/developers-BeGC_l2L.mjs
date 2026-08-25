import { _ as __nuxt_component_0 } from './PersonaHero-C6iJKIID.mjs';
import { defineComponent, withCtx, createVNode, unref, reactive, ref, mergeProps, useSSRContext } from 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/vue/server-renderer/index.mjs';
import { _ as _export_sfc, g as useTrack } from './server.mjs';
import { _ as __nuxt_component_2 } from './PressStrip-F9GuthzB.mjs';
import { u as useHead } from './v3-CGN8Ffpm.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/ofetch/dist/node.mjs';
import '../_/renderer.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/h3/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/ufo/dist/index.mjs';
import '../nitro/nitro.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/destr/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/hookable/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/node-mock-http/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unstorage/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unstorage/drivers/fs.mjs';
import 'node:crypto';
import 'node:fs/promises';
import 'node:path';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unstorage/drivers/lru-cache.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/ohash/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/klona/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/defu/dist/defu.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/scule/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unctx/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/pathe/dist/index.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unhead/dist/server.mjs';
import 'node:async_hooks';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/devalue/index.js';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unhead/dist/utils.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unhead/dist/plugins.mjs';
import 'file:///Users/mehul/Desktop/KAIZEN%20VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/vue-router/vue-router.node.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SectionDeveloper",
  __ssrInlineRender: true,
  setup(__props) {
    useTrack();
    const form = reactive({ name: "", company: "", contact: "", project: "" });
    const state = ref("idle");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "developers",
        class: "section developer"
      }, _attrs))} data-v-e5d20b7d><div class="copy" data-v-e5d20b7d><p class="eyebrow" data-v-e5d20b7d>FOR DEVELOPERS &amp; MASTER BROKERS</p><h2 class="display" data-v-e5d20b7d>One upload.<br data-v-e5d20b7d>One intelligent brief.</h2><p class="body" data-v-e5d20b7d> Connect your inventory once. Every broker pitching your project gets an AI that knows your live units, prices and payment plans \u2014 and you see exactly how it&#39;s being pitched. </p></div>`);
      if (unref(state) !== "done") {
        _push(`<form class="lead-form" data-v-e5d20b7d><div class="field" data-v-e5d20b7d><label for="lead-name" data-v-e5d20b7d>Your name</label><input id="lead-name"${ssrRenderAttr("value", unref(form).name)} required placeholder="Full name" data-v-e5d20b7d></div><div class="field" data-v-e5d20b7d><label for="lead-company" data-v-e5d20b7d>Company</label><input id="lead-company"${ssrRenderAttr("value", unref(form).company)} placeholder="Developer / brokerage" data-v-e5d20b7d></div><div class="field" data-v-e5d20b7d><label for="lead-contact" data-v-e5d20b7d>Email or WhatsApp</label><input id="lead-contact"${ssrRenderAttr("value", unref(form).contact)} required placeholder="How do we reach you?" data-v-e5d20b7d></div><div class="field" data-v-e5d20b7d><label for="lead-project" data-v-e5d20b7d>Project</label><input id="lead-project"${ssrRenderAttr("value", unref(form).project)} required placeholder="Which development do you want on Rechitta?" data-v-e5d20b7d></div><button class="btn btn-primary" type="submit"${ssrIncludeBooleanAttr(unref(state) === "sending") ? " disabled" : ""} data-v-e5d20b7d>${ssrInterpolate(unref(state) === "sending" ? "Sending\u2026" : "Upload your project \u2192")}</button>`);
        if (unref(state) === "error") {
          _push(`<p class="form-error" data-v-e5d20b7d>Something went wrong \u2014 try again or write to aryaman@rechitta.com.</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</form>`);
      } else {
        _push(`<div class="lead-done" data-v-e5d20b7d><p class="display" data-v-e5d20b7d>We&#39;re on it.</p><p class="body" data-v-e5d20b7d>The team will reach out within one business day to get your project live.</p></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SectionDeveloper.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-e5d20b7d"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "developers",
  __ssrInlineRender: true,
  setup(__props) {
    const { track } = useTrack();
    useHead({
      title: "Rechitta for Developers & Master Brokers",
      meta: [
        {
          name: "description",
          content: "Put your off-plan project on Rechitta. Every broker selling it gets an AI that knows your live inventory \u2014 and you see exactly how it is being pitched."
        }
      ]
    });
    const props = [
      {
        title: "Brief every broker at once",
        body: "No more assembling teams for repeated in-person sessions. Your project knowledge reaches the whole network the moment it changes."
      },
      {
        title: "Inventory that is never stale",
        body: "Prices, availability and payment plans update live. Every pitch a broker makes is made from your current truth."
      },
      {
        title: "See how you are being sold",
        body: "Analytics on briefings, engagement and broker performance for every development you put on the platform."
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PersonaHero = __nuxt_component_0;
      const _component_SectionDeveloper = __nuxt_component_1;
      const _component_PressStrip = __nuxt_component_2;
      _push(`<main${ssrRenderAttrs(_attrs)} data-v-eb7337a5>`);
      _push(ssrRenderComponent(_component_PersonaHero, {
        eyebrow: "FOR DEVELOPERS & MASTER BROKERS",
        title: "One upload.\nOne intelligent brief.",
        subtitle: "Put your project on Rechitta and every broker selling it gets an AI that knows your live inventory, prices and payment plans \u2014 while you see exactly how it's being pitched."
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<a href="#upload" class="btn btn-primary" data-v-eb7337a5${_scopeId}> Upload your project </a><a href="mailto:aryaman@rechitta.com" class="btn btn-ghost" data-v-eb7337a5${_scopeId}> Talk to us </a>`);
          } else {
            return [
              createVNode("a", {
                href: "#upload",
                class: "btn btn-primary",
                onClick: ($event) => unref(track)("cta:upload_project_click", { placement: "developers_hero" })
              }, " Upload your project ", 8, ["onClick"]),
              createVNode("a", {
                href: "mailto:aryaman@rechitta.com",
                class: "btn btn-ghost",
                onClick: ($event) => unref(track)("cta:talk_to_us_click", { placement: "developers_hero" })
              }, " Talk to us ", 8, ["onClick"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<section class="section value-props" data-v-eb7337a5><!--[-->`);
      ssrRenderList(props, (p) => {
        _push(`<article class="card" data-v-eb7337a5><h3 data-v-eb7337a5>${ssrInterpolate(p.title)}</h3><p data-v-eb7337a5>${ssrInterpolate(p.body)}</p></article>`);
      });
      _push(`<!--]--></section><div id="upload" data-v-eb7337a5>`);
      _push(ssrRenderComponent(_component_SectionDeveloper, null, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(_component_PressStrip, null, null, _parent));
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/developers.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const developers = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-eb7337a5"]]);

export { developers as default };
//# sourceMappingURL=developers-BeGC_l2L.mjs.map
