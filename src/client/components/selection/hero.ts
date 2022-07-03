import React from 'react';

import {Entity} from '@/core/entity';
import {GraphicsPipeline} from '@/core/graphics/pipe';

import {Component, Props} from '@/client/components';
import {HDCanvas} from '@/client/util';

interface HeroPanelProps {
  type: string;
}

interface HeroPanelState {
  entity?: Entity;
}

export class HeroPanel extends Component<HeroPanelProps, HeroPanelState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

  public constructor(props: Props<HeroPanelProps>) {
    super(props, {
      entity: undefined,
    });
  }

  private renderCanvas() {
    const canvas = this.canvasRef.current;
    const {entity} = this.state;
    if (canvas && entity) {
      const ctx = new HDCanvas(canvas, {width: 100, height: 100});
      ctx.begin();
      GraphicsPipeline.pipe().run(ctx, (ctx) => {
        entity.render(ctx);
      });
    }
  }

  public componentDidMount() {}
}
