export * from '@/core/graphics/color';
export * from '@/core/graphics/camera';
export * from '@/core/graphics/context';

import {GraphicsContext} from '@/core/graphics/context';

export interface Renderable {
  render(ctx: GraphicsContext): void;
}

import {CameraManager} from '@/core/graphics/camera';
const CM = new CameraManager();

export {CM as CameraManager};
