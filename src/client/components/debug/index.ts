import { Component } from 'client/components/util';
import template from 'client/components/debug/template.html';
import { SizedQueue } from 'core/util';
import { EventManager, StepEvent, Event } from 'core/event';
import { WorldManager } from 'core/entity';
import { MetricsEvent } from 'core/metrics';
import { PlayerManager } from 'core/player';

export class DebugComponent extends Component {
  public static componentName: string = 'debug-component';

  private fpsLabel?: HTMLElement;
  private entitiesLabel?: HTMLElement;
  private listenersLabel?: HTMLElement;
  private pingLabel?: HTMLElement;

  private serverTpsLabel?: HTMLElement;
  private serverEntitiesLabel?: HTMLElement;
  private serverListenersLabel?: HTMLElement;

  constructor() {
    super(template);

    this.fpsLabel = this.queryChild('#fps-label');
    this.entitiesLabel = this.queryChild('#entities-label');
    this.listenersLabel = this.queryChild('#listeners-label');
    this.pingLabel = this.queryChild('#ping-label');

    this.serverTpsLabel = this.queryChild('#server-tps-label');
    this.serverEntitiesLabel = this.queryChild('#server-entities-label');
    this.serverListenersLabel = this.queryChild('#server-listeners-label');

    const frameTimes = new SizedQueue<number>(60);

    // const timer = new Timer((dt) => {
    EventManager.addListener<StepEvent>('StepEvent', async (event) => {
      frameTimes.enqueue(event.data.dt);
      const sum = frameTimes.iterator().fold(0, (acc, x) => acc + x);
      const fps = frameTimes.size() / sum;
      const rounded = Math.round(fps);
      const label = rounded.toString();

      if (this.fpsLabel) {
        this.fpsLabel.innerText = label;
      }
      if (this.entitiesLabel) {
        this.entitiesLabel.innerText = '' + WorldManager.getEntityCount();
      }
      if (this.listenersLabel) {
        this.listenersLabel.innerText = '' + EventManager.getListenerCount();
      }
    });

    EventManager.addListener<MetricsEvent>('MetricsEvent', (event) => {
      const { tps, entities, listeners, pings } = event.data;
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
      const player = PlayerManager.getActivePlayer();
      if (player && this.pingLabel) {
        const ping = pings[player.id];
        if (typeof ping === 'number') {
          const ms = Math.round(ping * 1000);
          this.pingLabel.innerText = '' + ms + 'ms';
        }
      }
    });
  }
}
