import { BaseHero } from "core/entity";
import React from 'react';
import {Component} from 'client/components';
import { HDCanvas } from "client/util";
import { GraphicsPipeline } from "core/graphics/pipe";

interface HeroPanelProps {
  type: string;
}

interface HeroPanelState {
  hero?: BaseHero;
}

export class HeroPanel extends Component<HeroPanelProps, HeroPanelState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

  private renderCanvas(): void {
    const canvas = this.canvasRef.current;
    const {hero} = this.state;
    if (canvas && hero) {
      const ctx = new HDCanvas(canvas, {width: 100, height: 100});
      ctx.begin();
      GraphicsPipeline.pipe()
        .run(ctx, (ctx) => {
          hero.render(ctx);
        });
    }
  }
}


