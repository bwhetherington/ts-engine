import { Component } from 'client/components/util';
import template from 'client/components/debug/template.html';
import { SizedQueue } from 'core/util';
import { EM, StepEvent, Event } from 'core/event';
import { WM } from 'core/entity';
import { MetricsEvent } from 'core/metrics';

export class DebugComponent extends Component {
  public static componentName: string = 'debug-component';

  private fpsLabel?: HTMLElement;
  private entitiesLabel?: HTMLElement;

  private serverTpsLabel?: HTMLElement;
  private serverEntitiesLabel?: HTMLElement;
  private serverListenersLabel?: HTMLElement;

  constructor() {
    super(template);

    this.fpsLabel = this.queryChild('#fps-label');
    this.entitiesLabel = this.queryChild('#entities-label');

    this.serverTpsLabel = this.queryChild('#server-tps-label');
    this.serverEntitiesLabel = this.queryChild('#server-entities-label');
    this.serverListenersLabel = this.queryChild('#server-listeners-label');

    const frameTimes = new SizedQueue<number>(60);

    // const timer = new Timer((dt) => {
    EM.addListener<StepEvent>('StepEvent', (event) => {
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
      if (this.entitiesLabel) {
        this.entitiesLabel.innerText = '' + WM.getEntityCount();
      }
    });

    EM.addListener<MetricsEvent>('MetricsEvent', (event) => {
      const { tps, entities, listeners } = event.data;
      if (this.serverTpsLabel) {
        const rounded = Math.round(tps);
        this.serverTpsLabel.innerText = '' + rounded;
      }
      if (this.serverEntitiesLabel) {
        this.serverEntitiesLabel.innerText = '' + entities;
      }
      if (this.serverListenersLabel) {
        this.serverListenersLabel.innerText = '' + listeners;
      }
    });
  }
}
