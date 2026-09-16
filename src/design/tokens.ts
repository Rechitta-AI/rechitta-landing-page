/**
 * The Rechitta design system's colour tokens (design.md), for the places a
 * CSS variable cannot reach — SVG presentation attributes, and inline styles
 * on canvases that are scaled rather than laid out.
 *
 * `light` is the column for lit surfaces such as the boardroom screens; `dark`
 * for anything laid over the film itself.
 */

export const BRAND_BLUE = {
  200: '#B8CFFF',
  300: '#8BB0FF',
  500: '#3D6FF5',
  600: '#2A55E0',
} as const;

export const BRAND_GOLD = {
  300: '#DDBB73',
  500: '#C5A572',
  600: '#A6803D',
} as const;

export const NEUTRAL = {
  50: '#FAFAF9',
  100: '#F4F4F2',
  200: '#E8E8E5',
  300: '#D2D2CD',
  400: '#A8A8A1',
  500: '#7A7A72',
  600: '#535350',
  700: '#383836',
  800: '#222220',
  900: '#141413',
  950: '#0A0A09',
} as const;

export const SUCCESS_400 = '#56A05B';

export const light = {
  bgPrimary: '#FFFFFF',
  bgSecondary: NEUTRAL[50],
  bgTertiary: NEUTRAL[100],
  bgBrand: BRAND_BLUE[500],
  bgAccent: BRAND_GOLD[500],
  textPrimary: NEUTRAL[950],
  textSecondary: NEUTRAL[700],
  textTertiary: NEUTRAL[500],
  textDisabled: NEUTRAL[300],
  textBrand: BRAND_BLUE[600],
  textAccent: BRAND_GOLD[600],
  borderDefault: NEUTRAL[200],
  borderStrong: NEUTRAL[400],
  borderBrand: BRAND_BLUE[500],
  borderAccent: BRAND_GOLD[500],
  iconBrand: BRAND_BLUE[600],
} as const;

export const dark = {
  textPrimary: NEUTRAL[50],
  textSecondary: NEUTRAL[200],
  textTertiary: NEUTRAL[400],
  textBrand: BRAND_BLUE[300],
  textAccent: BRAND_GOLD[300],
  borderAccent: '#CFA34F',
} as const;
