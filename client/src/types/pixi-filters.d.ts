declare module '@pixi/filter-noise' {
  import { Filter } from 'pixi.js';
  export class NoiseFilter extends Filter {
    constructor(noise?: number, seed?: number);
    noise: number;
    seed: number;
  }
}