
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

interface _GlobalComponents {
  AppFooter: typeof import("../../components/AppFooter.vue")['default']
  AppHeader: typeof import("../../components/AppHeader.vue")['default']
  CityScrub: typeof import("../../components/CityScrub.client.vue")['default']
  HeroConversation: typeof import("../../components/HeroConversation.vue")['default']
  OfficePresentation: typeof import("../../components/OfficePresentation.vue")['default']
  OrbStage: typeof import("../../components/OrbStage.vue")['default']
  PersonaHero: typeof import("../../components/PersonaHero.vue")['default']
  PressStrip: typeof import("../../components/PressStrip.vue")['default']
  SceneStage: typeof import("../../components/SceneStage.vue")['default']
  SectionBroker: typeof import("../../components/SectionBroker.vue")['default']
  SectionDeveloper: typeof import("../../components/SectionDeveloper.vue")['default']
  SectionFinale: typeof import("../../components/SectionFinale.vue")['default']
  SectionLanguages: typeof import("../../components/SectionLanguages.vue")['default']
  TheOrb: typeof import("../../components/TheOrb.vue")['default']
  ThreeCity: typeof import("../../components/ThreeCity.client.vue")['default']
  FilmCalibrationTool: typeof import("../../components/film/CalibrationTool.client.vue")['default']
  FilmStoryboard: typeof import("../../components/film/FilmStoryboard.vue")['default']
  FilmScrollFilm: typeof import("../../components/film/ScrollFilm.client.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAppFooter: LazyComponent<typeof import("../../components/AppFooter.vue")['default']>
  LazyAppHeader: LazyComponent<typeof import("../../components/AppHeader.vue")['default']>
  LazyCityScrub: LazyComponent<typeof import("../../components/CityScrub.client.vue")['default']>
  LazyHeroConversation: LazyComponent<typeof import("../../components/HeroConversation.vue")['default']>
  LazyOfficePresentation: LazyComponent<typeof import("../../components/OfficePresentation.vue")['default']>
  LazyOrbStage: LazyComponent<typeof import("../../components/OrbStage.vue")['default']>
  LazyPersonaHero: LazyComponent<typeof import("../../components/PersonaHero.vue")['default']>
  LazyPressStrip: LazyComponent<typeof import("../../components/PressStrip.vue")['default']>
  LazySceneStage: LazyComponent<typeof import("../../components/SceneStage.vue")['default']>
  LazySectionBroker: LazyComponent<typeof import("../../components/SectionBroker.vue")['default']>
  LazySectionDeveloper: LazyComponent<typeof import("../../components/SectionDeveloper.vue")['default']>
  LazySectionFinale: LazyComponent<typeof import("../../components/SectionFinale.vue")['default']>
  LazySectionLanguages: LazyComponent<typeof import("../../components/SectionLanguages.vue")['default']>
  LazyTheOrb: LazyComponent<typeof import("../../components/TheOrb.vue")['default']>
  LazyThreeCity: LazyComponent<typeof import("../../components/ThreeCity.client.vue")['default']>
  LazyFilmCalibrationTool: LazyComponent<typeof import("../../components/film/CalibrationTool.client.vue")['default']>
  LazyFilmStoryboard: LazyComponent<typeof import("../../components/film/FilmStoryboard.vue")['default']>
  LazyFilmScrollFilm: LazyComponent<typeof import("../../components/film/ScrollFilm.client.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
