import { _ as __nuxt_component_0 } from './PersonaHero-C6iJKIID.mjs';
import { _ as _export_sfc, g as useTrack, a as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, withCtx, unref, createTextVNode, createVNode, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SectionLanguages",
  __ssrInlineRender: true,
  setup(__props) {
    const langs = [
      "English",
      "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      "\u0939\u093F\u0928\u094D\u0926\u0940",
      "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
      "\u4E2D\u6587",
      "Fran\xE7ais",
      "Deutsch",
      "T\xFCrk\xE7e",
      "\u0627\u0631\u062F\u0648",
      "Espa\xF1ol",
      "Italiano",
      "\u0641\u0627\u0631\u0633\u06CC"
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "languages",
        class: "section languages"
      }, _attrs))} data-v-a5db140a><p class="eyebrow" data-v-a5db140a>MULTILINGUAL BY DESIGN</p><h2 class="display" data-v-a5db140a>She speaks<br data-v-a5db140a>your language.</h2><p class="body" data-v-a5db140a> Rechitta briefs buyers in the language they think in \u2014 live, in voice and text. Dubai sells to the world; your AI should too. </p><div class="marquee" aria-hidden="true" data-v-a5db140a><div class="marquee-track" data-v-a5db140a><!--[-->`);
      ssrRenderList([...langs, ...langs], (l, i) => {
        _push(`<span data-v-a5db140a>${ssrInterpolate(l)}</span>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SectionLanguages.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-a5db140a"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "buyers",
  __ssrInlineRender: true,
  setup(__props) {
    const { track } = useTrack();
    useHead({
      title: "Rechitta for Buyers \u2014 Your private property curator",
      meta: [
        {
          name: "description",
          content: "When your broker sends a Rechitta briefing, you get a private guide to that development \u2014 floor plans, payment plans, live availability \u2014 in your language, no app required."
        }
      ]
    });
    const steps = [
      {
        title: "Your broker sends a link",
        body: "A private briefing for the development you are considering. It opens in your browser \u2014 nothing to install, nothing to sign up for."
      },
      {
        title: "You ask, she answers",
        body: "Floor plans, payment plans, what is actually still available \u2014 in your language, by voice or text, any hour of the day."
      },
      {
        title: "You decide with clarity",
        body: "Everything comes from the developer's live inventory for that project. No guesswork, no stale brochures."
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PersonaHero = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_SectionLanguages = __nuxt_component_2;
      _push(`<main${ssrRenderAttrs(_attrs)} data-v-4aeb1a51>`);
      _push(ssrRenderComponent(_component_PersonaHero, {
        eyebrow: "FOR BUYERS",
        title: "Your private\nproperty curator.",
        subtitle: "When your broker sends a Rechitta briefing, you get a private guide to that development \u2014 floor plans, payment plans, live availability \u2014 in your language, no app required."
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: "/",
              class: "btn btn-primary",
              onClick: ($event) => unref(track)("cta:see_demo_click", { placement: "buyers_hero" })
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(` See how a briefing works `);
                } else {
                  return [
                    createTextVNode(" See how a briefing works ")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`<a href="mailto:aryaman@rechitta.com" class="btn btn-ghost" data-v-4aeb1a51${_scopeId}> Talk to us </a>`);
          } else {
            return [
              createVNode(_component_NuxtLink, {
                to: "/",
                class: "btn btn-primary",
                onClick: ($event) => unref(track)("cta:see_demo_click", { placement: "buyers_hero" })
              }, {
                default: withCtx(() => [
                  createTextVNode(" See how a briefing works ")
                ]),
                _: 1
              }, 8, ["onClick"]),
              createVNode("a", {
                href: "mailto:aryaman@rechitta.com",
                class: "btn btn-ghost",
                onClick: ($event) => unref(track)("cta:talk_to_us_click", { placement: "buyers_hero" })
              }, " Talk to us ", 8, ["onClick"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<section class="section steps" data-v-4aeb1a51><!--[-->`);
      ssrRenderList(steps, (s, i) => {
        _push(`<article class="card" data-v-4aeb1a51><p class="step-num" data-v-4aeb1a51>0${ssrInterpolate(i + 1)}</p><h3 data-v-4aeb1a51>${ssrInterpolate(s.title)}</h3><p data-v-4aeb1a51>${ssrInterpolate(s.body)}</p></article>`);
      });
      _push(`<!--]--></section>`);
      _push(ssrRenderComponent(_component_SectionLanguages, null, null, _parent));
      _push(`</main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/buyers.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const buyers = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4aeb1a51"]]);

export { buyers as default };
//# sourceMappingURL=buyers-B93ni-Cz.mjs.map
