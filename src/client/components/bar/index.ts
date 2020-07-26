import { Component } from 'client/components/util';
import template from 'client/components/bar/template.html';
import { EM, Event } from 'core/event';
import { BarUpdateEvent } from 'core/util';

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

  public setValue(value: number): void {
    this.value = value;
  }

  public setMaxValue(value: number): void {
    this.maxValue = value;
  }

  private registerListeners(): void {
    EM.addListener('BarUpdateEvent', (event: Event<BarUpdateEvent>) => {
      const { id, value, maxValue } = event.data;
      if (this.id === id) {
        const old = this.value;
        if (value !== undefined) {
          this.valueInternal = value;
        }
        if (maxValue !== undefined) {
          this.maxValueInternal = maxValue;
        }
        this.updateElement(old, this.value);
      }
    });
  }
}
