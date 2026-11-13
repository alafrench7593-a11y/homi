/**
 * Matières HOMI v3 : verre optique, verre fumé / givré, surface mate (voir HOMI_DESIGN_SYSTEM.md § 3).
 *   import { OpticalGlass, FrostedGlass, MatteSurface, Surface } from '@/components/surfaces';
 */
export { FrostedGlass, MatteSurface, OpticalGlass, Surface, SurfaceLight, transparentOf, type SurfaceProps } from './Surface';
export { BLUR_OK, LIQUID_GLASS_NATIVE, NativeGlass, useReduceTransparency } from './nativeGlass';
