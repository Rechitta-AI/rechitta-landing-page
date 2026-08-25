import { mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "press" }, _attrs))} data-v-b1d887d0><p class="kicker" data-v-b1d887d0>AS FEATURED IN \xB7 52 placements \xB7 13.2M readers \xB7 May 2026</p><ul class="outlets" data-v-b1d887d0><li data-v-b1d887d0>Khaleej Times</li><li data-v-b1d887d0>Zawya</li><li data-v-b1d887d0>Gulf Today</li><li data-v-b1d887d0>Al Bayan</li><li data-v-b1d887d0>Dubai Eye 103.8</li><li data-v-b1d887d0>Property Times</li></ul></section>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PressStrip.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-b1d887d0"]]);

export { __nuxt_component_2 as _ };
//# sourceMappingURL=PressStrip-F9GuthzB.mjs.map
