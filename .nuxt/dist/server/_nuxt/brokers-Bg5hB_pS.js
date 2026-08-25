import { _ as __nuxt_component_0 } from "./PersonaHero-C6iJKIID.js";
import { defineComponent, reactive, ref, mergeProps, unref, useSSRContext, withCtx, createVNode } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderComponent, ssrRenderList } from "vue/server-renderer";
import { g as useTrack, _ as _export_sfc } from "../server.mjs";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/hookable/dist/index.mjs";
import { u as useHead } from "./v3-CGN8Ffpm.js";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/unctx/dist/index.mjs";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/defu/dist/defu.mjs";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/ufo/dist/index.mjs";
import "/Users/mehul/Desktop/KAIZEN VENTURES/SENSEIBLES/PROJECTS/RECHITTA/rechitta-landing-page/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SectionBroker",
  __ssrInlineRender: true,
  setup(__props) {
    useTrack();
    const form = reactive({ name: "", agency: "", whatsapp: "", languages: "" });
    const state = ref("idle");
    const result = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "brokers",
        class: "section broker"
      }, _attrs))} data-v-fa2bbd86><div class="copy" data-v-fa2bbd86><p class="eyebrow" data-v-fa2bbd86>FOR BROKERS — FOUNDING COHORT</p><h2 class="display" data-v-fa2bbd86>Send the link.<br data-v-fa2bbd86>Close the deal.</h2><p class="body" data-v-fa2bbd86> Founding Brokers get early access to every development on Rechitta, briefings in the buyer&#39;s language, and a place in line that you can move up by referring brokers you rate. </p></div>`);
      if (unref(state) !== "done") {
        _push(`<form class="waitlist-form" data-v-fa2bbd86><div class="field" data-v-fa2bbd86><label for="wl-name" data-v-fa2bbd86>Your name</label><input id="wl-name"${ssrRenderAttr("value", unref(form).name)} required placeholder="Full name" data-v-fa2bbd86></div><div class="field" data-v-fa2bbd86><label for="wl-agency" data-v-fa2bbd86>Agency</label><input id="wl-agency"${ssrRenderAttr("value", unref(form).agency)} placeholder="Brokerage you work with" data-v-fa2bbd86></div><div class="field" data-v-fa2bbd86><label for="wl-whatsapp" data-v-fa2bbd86>WhatsApp</label><input id="wl-whatsapp"${ssrRenderAttr("value", unref(form).whatsapp)} required placeholder="+971 …" data-v-fa2bbd86></div><div class="field" data-v-fa2bbd86><label for="wl-langs" data-v-fa2bbd86>Languages you sell in</label><input id="wl-langs"${ssrRenderAttr("value", unref(form).languages)} placeholder="e.g. English, Arabic, Hindi" data-v-fa2bbd86></div><button class="btn btn-gold" type="submit"${ssrIncludeBooleanAttr(unref(state) === "sending") ? " disabled" : ""} data-v-fa2bbd86>${ssrInterpolate(unref(state) === "sending" ? "Joining…" : "Claim your spot →")}</button>`);
        if (unref(state) === "error") {
          _push(`<p class="form-error" data-v-fa2bbd86>Something went wrong — try again or write to aryaman@rechitta.com.</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</form>`);
      } else {
        _push(`<div class="waitlist-done" data-v-fa2bbd86><p class="eyebrow" data-v-fa2bbd86>YOU&#39;RE IN</p><p class="display position" data-v-fa2bbd86>Founding Broker #${ssrInterpolate(unref(result)?.position)}</p><p class="body" data-v-fa2bbd86> We&#39;ll WhatsApp you when your access opens. Want to move up the list? Share your referral code with brokers you rate: </p><p class="referral" data-v-fa2bbd86>${ssrInterpolate(unref(result)?.referralCode)}</p></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SectionBroker.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-fa2bbd86"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "brokers",
  __ssrInlineRender: true,
  setup(__props) {
    const { track } = useTrack();
    useHead({
      title: "Rechitta for Brokers — Founding Cohort",
      meta: [
        {
          name: "description",
          content: "Ask about any development on Rechitta and share a branded briefing in your client's language — in seconds, on WhatsApp. Join the Founding Broker waitlist."
        }
      ]
    });
    const props = [
      {
        title: "Answers in seconds",
        body: "Which units are left, at what price, on what plan — for any development on Rechitta. No PDFs, no portals, no calls to the sales office."
      },
      {
        title: "Briefings that close",
        body: "Branded, shareable property briefings generated for your client — in the language they think in. Send the link on WhatsApp."
      },
      {
        title: "Founding Broker status",
        body: "A numbered place in the first cohort, early access to every new project, and referrals that move you up the list."
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PersonaHero = __nuxt_component_0;
      const _component_SectionBroker = __nuxt_component_1;
      _push(`<main${ssrRenderAttrs(_attrs)} data-v-62f99ef9>`);
      _push(ssrRenderComponent(_component_PersonaHero, {
        eyebrow: "FOR BROKERS — FOUNDING COHORT",
        title: "Send the link.\nClose the deal.",
        subtitle: "Ask about any development on Rechitta and share a branded briefing in your client's language — in seconds, on WhatsApp."
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<a href="#waitlist" class="btn btn-gold" data-v-62f99ef9${_scopeId}> Claim your spot → </a>`);
          } else {
            return [
              createVNode("a", {
                href: "#waitlist",
                class: "btn btn-gold",
                onClick: ($event) => unref(track)("cta:broker_waitlist_click", { placement: "brokers_hero" })
              }, " Claim your spot → ", 8, ["onClick"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<section class="section value-props" data-v-62f99ef9><!--[-->`);
      ssrRenderList(props, (p) => {
        _push(`<article class="card" data-v-62f99ef9><h3 data-v-62f99ef9>${ssrInterpolate(p.title)}</h3><p data-v-62f99ef9>${ssrInterpolate(p.body)}</p></article>`);
      });
      _push(`<!--]--></section><div id="waitlist" data-v-62f99ef9>`);
      _push(ssrRenderComponent(_component_SectionBroker, null, null, _parent));
      _push(`</div></main>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/brokers.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const brokers = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-62f99ef9"]]);
export {
  brokers as default
};
//# sourceMappingURL=brokers-Bg5hB_pS.js.map
