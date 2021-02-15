import { BaseHero } from "core/entity";

export abstract class Upgrade {
  public abstract applyTo(hero: BaseHero): void;
}