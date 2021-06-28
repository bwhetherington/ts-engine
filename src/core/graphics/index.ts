export const PIXEL_SIZE = 6;

export * from 'core/graphics/color';
export * from 'core/graphics/camera';
export * from 'core/graphics/image';
export * from 'core/graphics/context';
export * from 'core/graphics/animation';
export * from 'core/graphics/sprite';
export * from 'core/graphics/font';

import {GraphicsContext} from 'core/graphics/context';

export interface Renderable {
  render(ctx: GraphicsContext): void;
}

import {CameraManager} from 'core/graphics/camera';
const CM = new CameraManager();
export {CM as CameraManager};

import {TileManager} from 'core/graphics/tile';
const TM = new TileManager();
export {TM as TileManager};
