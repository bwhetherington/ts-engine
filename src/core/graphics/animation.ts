import { Iterator } from 'core/iterator';
import {Data, Serializable} from 'core/serialize';

export class Animation implements Serializable {
  public frames: number[] = [];
  private index: number = 0;

  public step(): boolean {
    this.index += 1;
    return this.isComplete();
  }

  public reset(): void {
    this.index = 0;
  }

  public getFrame(): number {
    return this.frames[this.index];
  }

  public isComplete(): boolean {
    return this.index >= this.frames.length;
  }

  public serialize(): Data {
    return {
      frames: this.frames,
    };
  }

  public deserialize(data: Data): void {
    const {frames, index} = data;
    if (frames instanceof Array) {
      const frameArray: number[] = [];
      let isValid = true;
      for (const entry of frames) {
        if (typeof entry === 'number') {
          frameArray.push(entry);
        } else {
          isValid = false;
          break;
        }
      }
      this.frames = frameArray;
    }

    if (typeof index === 'number') {
      this.index = index % this.frames.length;
    }
  }
}

export class AnimationMap implements Serializable {
  private map: Record<string, Animation> = {};

  public serialize(): Data {
    return Iterator.entries(this.map)
      .map<[string, Data]>(([animName, anim]) => [animName, anim.serialize()])
      .fold<Data>({}, (output, [animName, anim]) => {
        output[animName] = anim;
        return output;
      });
  }

  public get(name: string): Animation | undefined {
    return this.map[name];
  }

  public deserialize(data: Data): void {
    Iterator.entries(data)
      .forEach(([animName, animData]) => {
        let anim = this.map[animName];
        if (!anim) {
          anim = new Animation();
          this.map[animName] = anim;
        }
        anim.deserialize(animData);
      });
  }
}
