import { defineComponent, mergeProps, ref, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderSlot, ssrRenderAttr } from 'vue/server-renderer';
import { _ as _export_sfc, h as _imports_0 } from './server.mjs';

const SPLINE_URL = "https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TheOrb",
  __ssrInlineRender: true,
  props: {
    innerFilter: {}
  },
  setup(__props) {
    const revealed = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["orb", { revealed: unref(revealed) }],
        "aria-hidden": "true"
      }, _attrs))} data-v-826e6e18><div class="orb-inner" style="${ssrRenderStyle(__props.innerFilter ? { filter: __props.innerFilter } : void 0)}" data-v-826e6e18><iframe${ssrRenderAttr("src", SPLINE_URL)} title="Rechitta orb" allow="autoplay" data-v-826e6e18></iframe></div><img class="brand-icon"${ssrRenderAttr("src", _imports_0)} alt="" data-v-826e6e18></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TheOrb.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-826e6e18"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PersonaHero",
  __ssrInlineRender: true,
  props: {
    eyebrow: {},
    title: {},
    subtitle: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_TheOrb = __nuxt_component_0$1;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "persona-hero" }, _attrs))} data-v-7a73ca18>`);
      _push(ssrRenderComponent(_component_TheOrb, { class: "orb-sized" }, null, _parent));
      _push(`<p class="eyebrow" data-v-7a73ca18>${ssrInterpolate(__props.eyebrow)}</p><h1 class="display headline" style="${ssrRenderStyle({ "white-space": "pre-line" })}" data-v-7a73ca18>${ssrInterpolate(__props.title)}</h1>`);
      if (__props.subtitle) {
        _push(`<p class="subhead" data-v-7a73ca18>${ssrInterpolate(__props.subtitle)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="ctas" data-v-7a73ca18>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PersonaHero.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-7a73ca18"]]);

export { __nuxt_component_0 as _ };
//# sourceMappingURL=PersonaHero-C6iJKIID.mjs.map
