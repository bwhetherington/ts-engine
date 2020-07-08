import { Component } from 'client/components/util';
import template from 'client/components/bar/template.html';
import { EM, Event } from 'core/event';

export interface BarUpdateEvent {
  id: string;
  current?: number;
  max?: number;
}

export class BarComponent extends Component {
  public static componentName: string = 'bar-component';

  private bar?: HTMLElement;
  private label?: HTMLElement;
  private valueInternal: number = 0;
  private maxValueInternal: number = 100;

  constructor() {
    super(template);

    this.bar = this.queryChild('#bar-value');
    this.label = this.queryChild('#bar-label');

    this.registerListeners();
  }

  public get value(): number {
    return this.valueInternal;
  }

  public get maxValue(): number {
    return this.maxValueInternal;
  }

  public set maxValue(val) {
    const old = this.valueInternal;
    this.maxValueInternal = val;
    this.updateElement(old, val);
  }

  public set value(val) {
    const old = this.valueInternal;
    this.valueInternal = val;
    this.updateElement(old, val);
  }

  private registerListeners(): void {
    EM.addListener('BarUpdateEvent', (event: Event<BarUpdateEvent>) => {
      const { id, current, max } = event.data;
      if (this.id === id) {
        const old = this.value;
        if (current !== undefined) {
          this.valueInternal = current;
        }
        if (max !== undefined) {
          this.maxValueInternal = max;
        }
        this.updateElement(old, this.value);
      }
    });
  }

  private updateElement(oldValue: number, newValue: number): void {
    if (oldValue !== newValue) {
      const width = Math.round((this.value / this.maxValue) * 100) + '%';
      if (this.label) {
        this.label.innerText =
          Math.round(this.value) + '/' + Math.round(this.maxValue);
      }
      if (this.bar) {
        this.bar.style.width = width;
      }
    }
  }
}
