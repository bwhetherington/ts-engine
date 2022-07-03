import {AssetIdentifier, isAssetIdentifier} from '@/core/assets';
import {IntervalEffect} from '@/core/effect';
import {Unit, WorldManager} from '@/core/entity';
import {Vector} from '@/core/geometry';
import {RNGManager} from '@/core/random';
import {Data} from '@/core/serialize';

export class SpawnEffect extends IntervalEffect {
  public static typeName: string = 'SpawnEffect';

  public entity?: AssetIdentifier;
  public entityDuration: number = 2;

  public override serialize(): Data {
    return {
      ...super.serialize(),
      entity: this.entity,
      entityDuration: this.entityDuration,
    };
  }

  public override deserialize(data: Data, initialize?: boolean): void {
    super.deserialize(data, initialize);
    const {entity, entityDuration} = data;
    if (isAssetIdentifier(entity)) {
      this.entity = entity;
    }
    if (typeof entityDuration === 'number') {
      this.entityDuration = entity;
    }
  }

  protected override run() {
    if (!this.entity) {
      return;
    }

    const child = WorldManager.spawnEntity(this.entity);

    if (child instanceof Unit && this.source?.team !== undefined) {
      // Find position near character
      const RADIUS = 75;
      Vector.BUFFER.setXY(1, 0);
      Vector.BUFFER.angle = RNGManager.nextFloat(0, 2 * Math.PI);
      Vector.BUFFER.magnitude = RNGManager.nextFloat(0, RADIUS);
      Vector.BUFFER.add(this.source.position);
      child.setPosition(Vector.BUFFER);
      child.setTeam(this.source.team);
      child.setXPWorth(0);
    }

    child
      ?.streamInterval(this.entityDuration)
      .take(1)
      .forEach(() => {
        child.markForDelete();
      });
  }
}
