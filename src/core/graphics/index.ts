import {
  Color,
  invert,
  reshade,
  toCss,
  isColor,
  rgb,
  rgba,
} from 'core/graphics/color';

import {
  TextStyle,
  GraphicsOptions,
  GraphicsContext,
} from 'core/graphics/context';
import { CameraManager } from 'core/graphics/camera';

const CM = new CameraManager();
export {
  Color,
  TextStyle,
  GraphicsOptions,
  GraphicsContext,
  invert,
  reshade,
  toCss,
  isColor,
  rgb,
  rgba,
  CM as CameraManager,
};
