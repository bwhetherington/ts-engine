import {Serializable, Data} from 'core/serialize';
import {GameImage, Renderable, GraphicsContext} from 'core/graphics';
import {AssetManager} from 'core/assets';
import {Iterator} from 'core/iterator';
import { Cache } from 'core/util';

type AtlasRef = [number, number, number, number];

type CharacterMap = Record<string, AtlasRef>;

const STRING_CACHE_SIZE = 30;

export class Font implements Serializable {
  private atlas?: GameImage;
  private characterMap: CharacterMap = {};
  private stringCache: Cache<GameImage> = new Cache(STRING_CACHE_SIZE);
  private height: number = 0;

  public serialize(): Data {
    return {};
  }

  public measureString(input: string): number {
    let length = 0;

    for (const char of input) {
      if (char === ' ') {
        length += 2;
      } else {
        const entry = this.characterMap[char.toLowerCase()];
        if (!entry) {
          continue;
        }

        const [_x, _y, w, _h] = entry;
        length += w + 1;
      }
    }

    if (length > 0) {
      length -= 1;
    }

    return length;
  }

  private renderString(input: string): GameImage | undefined {
    if (!this.atlas) {
      return;
    }

    const existing = this.stringCache.get(input);
    if (existing) {
      return existing;
    }

    const image = document.createElement('canvas');
    image.width = this.measureString(input);
    image.height = this.height;

    const ctx = image.getContext('2d');
    if (!ctx) {
      return;
    }

    let xOffset = 0;
    for (const char of input) {
      if (char === ' ') {
        xOffset += 2;
      } else {
        const entry = this.characterMap[char.toLowerCase()];
        if (!entry) {
          continue;
        }

        const [x, y, w, h] = entry;
        ctx.drawImage(this.atlas, x, y, w, h, xOffset, 0, w, h);
        xOffset += w + 1;
      }
    }

    // Cache the image so it can be rendered again quickly
    this.stringCache.insert(input, image);

    return image;
  }

  public deserialize(data: Data): void {
    const {image, characters} = data;
    if (typeof image === 'string') {
      AssetManager.loadImage(image).then((image) => {
        this.atlas = image;
      });
    }
    if (typeof characters === 'object') {
      Iterator.entries(characters).forEach(([key, value]) => {
        if (value instanceof Array && value.length === 4) {
          const [x, y, w, h] = value;
          if (
            typeof x === 'number' &&
            typeof y === 'number' &&
            typeof w === 'number' &&
            typeof h === 'number'
          ) {
            this.characterMap[key] = [x, y, w, h];
            this.height = h;
          }
        }
      });
    }
  }

  public render(
    ctx: GraphicsContext,
    input: string,
    x: number,
    y: number
  ): void {
    const image = this.renderString(input);

    if (!image) {
      return;
    }

    ctx.image(
      image,
      Math.floor(x - image.width / 2),
      y,
      image.width,
      image.height,
      0,
      0,
      image.width,
      image.height
    );
  }
}
