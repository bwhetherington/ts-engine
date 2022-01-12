import React from 'react';
import {Component} from '@/client/components';
import {StepEvent} from '@/core/event';
import {Column, Panel, PanelHeader} from './common';
import {HDCanvas} from '@/client/util';
import {CollisionLayer, Entity, BaseHero, WorldManager} from '@/core/entity';
import {Color, rgba, WHITE} from '@/core/graphics/color';
import {GraphicsPipeline} from '@/core/graphics/pipe';

const CANVAS_OPTIONS = {
  width: 200,
  height: 200,
};

const TRANSPARENT = rgba(1, 1, 1, 0.35);

interface RadarState {
  unitCount: number;
}

export class Radar extends Component<{}, RadarState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

  private computeColor(entity: Entity): Color {
    const isOpaque =
      entity.collisionLayer === CollisionLayer.Geometry ||
      (entity instanceof BaseHero && entity.getPlayer()?.isActivePlayer());
    return isOpaque ? WHITE : TRANSPARENT;
  }

  private renderRadar = (): void => {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const ctx = new HDCanvas(canvas, CANVAS_OPTIONS);
      ctx.begin();
      const bounds = WorldManager.boundingBox;
      const size = Math.max(bounds.width, bounds.height);
      GraphicsPipeline.pipe()
        .options({
          doFill: true,
          doStroke: false,
        })
        .scale(ctx.getWidth() / size)
        .translate(bounds.width / 2, bounds.height / 2)
        .run(ctx, (ctx) => {
          WorldManager.getEntities()
            .filterMap((entity) =>
              entity.collisionLayer === CollisionLayer.Unit ||
              entity.collisionLayer === CollisionLayer.Geometry
                ? entity
                : undefined
            )
            .forEach((entity) => {
              const {x, y, width, height} = entity.boundingBox;
              ctx.rect(x, y, width, height, this.computeColor(entity));
            });
        });
    }
  };

  public componentDidMount() {
    this.streamEvents<StepEvent>('StepEvent').forEach(() => {
      this.renderRadar();
      this.updateState({
        unitCount: WorldManager.getUnitCount(),
      });
    });
  }

  public render(): JSX.Element {
    return (
      <Panel>
        <PanelHeader>
          <b>Radar</b> ({this.state.unitCount} units)
        </PanelHeader>
        <canvas ref={this.canvasRef} />
      </Panel>
    );
  }
}
