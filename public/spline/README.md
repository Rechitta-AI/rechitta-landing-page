# Self-hosted Spline runtime — DO NOT UPGRADE CASUALLY

`runtime.js` is `@splinetool/runtime@1.12.95`, **pinned** to match
`Rechitta-AI/interaction` (the product's Orb.vue). The film's orb transparency
relies on private APIs (`app._scene.activePage.bgColor.a = 0`, monkey-patched
`_renderer.setClearColor`) — version drift renders an opaque square over the
film. Re-verify those hacks against any new runtime before bumping.

The sibling `*.js` chunk files are the runtime's lazy-loaded build chunks. The
runtime resolves them **relative to its own URL**, so they must stay siblings
of `runtime.js` (this was the prototype's "plastic ball" bug).

`scene.splinecode` (not yet present): the owner's Spline-editor export of scene
`IsMZdCzuXM91-03p` (Orb.vue's scene). Until it lands here, the engine falls
back to `https://prod.spline.design/IsMZdCzuXM91-03p/scene.splinecode`.
Dropping the file in removes the last third-party request from the brand's
critical path. Re-verify the transparency hacks against the exported file too.
