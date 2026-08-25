
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const AppFooter: typeof import("../components/AppFooter.vue")['default']
export const AppHeader: typeof import("../components/AppHeader.vue")['default']
export const CityScrub: typeof import("../components/CityScrub.client.vue")['default']
export const HeroConversation: typeof import("../components/HeroConversation.vue")['default']
export const OfficePresentation: typeof import("../components/OfficePresentation.vue")['default']
export const OrbStage: typeof import("../components/OrbStage.vue")['default']
export const PersonaHero: typeof import("../components/PersonaHero.vue")['default']
export const PressStrip: typeof import("../components/PressStrip.vue")['default']
export const SceneStage: typeof import("../components/SceneStage.vue")['default']
export const SectionBroker: typeof import("../components/SectionBroker.vue")['default']
export const SectionDeveloper: typeof import("../components/SectionDeveloper.vue")['default']
export const SectionFinale: typeof import("../components/SectionFinale.vue")['default']
export const SectionLanguages: typeof import("../components/SectionLanguages.vue")['default']
export const TheOrb: typeof import("../components/TheOrb.vue")['default']
export const ThreeCity: typeof import("../components/ThreeCity.client.vue")['default']
export const FilmCalibrationTool: typeof import("../components/film/CalibrationTool.client.vue")['default']
export const FilmStoryboard: typeof import("../components/film/FilmStoryboard.vue")['default']
export const FilmScrollFilm: typeof import("../components/film/ScrollFilm.client.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyAppFooter: LazyComponent<typeof import("../components/AppFooter.vue")['default']>
export const LazyAppHeader: LazyComponent<typeof import("../components/AppHeader.vue")['default']>
export const LazyCityScrub: LazyComponent<typeof import("../components/CityScrub.client.vue")['default']>
export const LazyHeroConversation: LazyComponent<typeof import("../components/HeroConversation.vue")['default']>
export const LazyOfficePresentation: LazyComponent<typeof import("../components/OfficePresentation.vue")['default']>
export const LazyOrbStage: LazyComponent<typeof import("../components/OrbStage.vue")['default']>
export const LazyPersonaHero: LazyComponent<typeof import("../components/PersonaHero.vue")['default']>
export const LazyPressStrip: LazyComponent<typeof import("../components/PressStrip.vue")['default']>
export const LazySceneStage: LazyComponent<typeof import("../components/SceneStage.vue")['default']>
export const LazySectionBroker: LazyComponent<typeof import("../components/SectionBroker.vue")['default']>
export const LazySectionDeveloper: LazyComponent<typeof import("../components/SectionDeveloper.vue")['default']>
export const LazySectionFinale: LazyComponent<typeof import("../components/SectionFinale.vue")['default']>
export const LazySectionLanguages: LazyComponent<typeof import("../components/SectionLanguages.vue")['default']>
export const LazyTheOrb: LazyComponent<typeof import("../components/TheOrb.vue")['default']>
export const LazyThreeCity: LazyComponent<typeof import("../components/ThreeCity.client.vue")['default']>
export const LazyFilmCalibrationTool: LazyComponent<typeof import("../components/film/CalibrationTool.client.vue")['default']>
export const LazyFilmStoryboard: LazyComponent<typeof import("../components/film/FilmStoryboard.vue")['default']>
export const LazyFilmScrollFilm: LazyComponent<typeof import("../components/film/ScrollFilm.client.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
