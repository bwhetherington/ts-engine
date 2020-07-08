import { Component } from 'client/components/util';
import template from 'client/components/debug/template.html';
import { SizedQueue } from 'core/util';
import { EM, StepEvent, Event } from 'core/event';

export class DebugComponent extends Component {
  public static componentName: string = 'debug-component';

  private fpsLabel?: HTMLElement;
  private highlightLabel?: HTMLElement;

  constructor() {
    super(template);

    this.fpsLabel = this.queryChild('#fps-label');

    const frameTimes = new SizedQueue<number>(60);

    // const timer = new Timer((dt) => {
    EM.addListener('StepEvent', (event: Event<StepEvent>) => {
      frameTimes.enqueue(event.data.dt);
      let sum = 0;
      for (const elem of frameTimes.iterator()) {
        sum += elem;
      }
      const fps = 1 / (sum / frameTimes.size());
      const rounded = Math.round(fps);
      const label = rounded.toString();

      if (this.fpsLabel) {
        this.fpsLabel.innerText = label;
      }
    });
  }
}
