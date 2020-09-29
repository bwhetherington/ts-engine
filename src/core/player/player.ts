import { Hero, WorldManager, KillEvent } from 'core/entity';
import { Serializable, Data } from 'core/serialize';
import { Socket, NetworkManager } from 'core/net';
import { PlayerManager, Account } from 'core/player';
import { UUIDManager, UUID } from 'core/uuid';
import { EventData, Handler, EventManager } from 'core/event';
import { capitalize, sleep } from 'core/util';
import { LogManager } from 'core/log';
import { BasicAuth } from 'core/net/http';
import { randomColor } from 'core/graphics/color';

const log = LogManager.forFile(__filename);

export class Player implements Serializable {
  public name: string = 'Anonymous';
  public id: string;
  public hero?: Hero;
  public socket: Socket = -1;
  public hasJoined: boolean = false;
  public ping: number = 0;
  public score: number = 0;

  private permissionLevel: number = 0;

  private auth?: BasicAuth;

  private listeners: Record<string, Set<UUID>> = {};

  public constructor(id?: UUID) {
    if (id) {
      this.id = id;
    } else {
      this.id = UUIDManager.generate();
    }

    if (NetworkManager.isServer()) {
      this.addListener<KillEvent>('KillEvent', async (event) => {
        const { targetID } = event.data;
        if (targetID && this.hero && targetID === this.hero.id) {
          await sleep(3);

          // Check that we haven't already respawned
          if (targetID === this.hero.id) {
            const hero = WorldManager.spawn(Hero);

            const x = (Math.random() - 0.5) * 1120;
            const y = (Math.random() - 0.5) * 1120;
            log.debug('respawn ' + x + ',' + y);
            hero.setPositionXY(x, y);

            hero.setColor(this.hero.getColor());
            this.setHero(hero);
          }
        }
      });
    }
  }

  public getPermissionLevel(): number {
    return this.permissionLevel ?? 0;
  }

  public isAdmin(): boolean {
    return this.getPermissionLevel() > 0;
  }

  private getListeners(type: string): Set<UUID> {
    let set = this.listeners[type];

    if (!set) {
      set = new Set();
      this.listeners[type] = set;
    }

    return set;
  }

  public addListener<E extends EventData>(
    type: string,
    handler: Handler<E>
  ): void {
    const id = EventManager.addListener(type, handler);
    this.getListeners(type).add(id);
  }

  public serialize(): Data {
    return {
      name: this.name,
      heroID: this.hero?.id ?? null,
      socket: this.socket,
      score: this.score,
      hasJoined: this.hasJoined,
    };
  }

  public deserialize(data: Data): void {
    const { name, id, socket, heroID, score, hasJoined } = data;
    if (typeof id === 'string') {
      this.id = id;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof socket === 'number') {
      this.socket = socket;
    }
    if (typeof heroID == 'string') {
      const entity = WorldManager.getEntity(heroID);
      if (entity instanceof Hero) {
        this.setHero(entity);
      }
    }
    if (typeof score === 'number') {
      this.score = score;
    }
    if (typeof hasJoined === 'boolean') {
      this.hasJoined = hasJoined;
    }
  }

  public setHero(hero: Hero): void {
    if (hero !== this.hero) {
      this.hero?.markForDelete();
      this.hero = hero;
    }
    if (hero.getPlayer() !== this) {
      hero.setPlayer(this);
    }
  }

  public async cleanup(): Promise<void> {
    this.hero?.markForDelete();
    UUIDManager.free(this.id);

    for (const type in this.listeners) {
      const handlerSet = this.listeners[type];
      for (const id of handlerSet) {
        EventManager.removeListener(type, id);
      }
    }

    log.info('cleanup ' + this.name);
    await this.save();
  }

  public setAuth(auth: BasicAuth): void {
    this.auth = auth;
  }

  private spawnHero(): Hero {
    const hero = WorldManager.spawn(Hero);
    const x = (Math.random() - 0.5) * 1120;
    const y = (Math.random() - 0.5) * 1120;
    hero.setPositionXY(x, y);
    hero.setPlayer(this);
    const color = randomColor();
    hero.setColor(color);
    return hero;
  }

  public load(account: Account): void {
    // Delete the current hero, if it exists
    this.hero?.markForDelete();

    const { xp, permissionLevel, username, className } = account;

    this.name = capitalize(username);
    const hero = this.spawnHero();
    const color = randomColor();
    hero.setColor(color);
    this.setHero(hero);
    this.hasJoined = true;
    hero.setExperience(xp ?? 0);
    hero.setLife(hero.getMaxLife());
    this.setClass(className);
    this.permissionLevel = permissionLevel;
  }

  public async save(): Promise<void> {
    if (this.auth) {
      const account = this.createAccountUpdate();
      await this.write(account);
      log.trace('player ' + this.name + ' saved');
    }
  }

  private createAccountUpdate(): Partial<Account> {
    return {
      username: this.auth?.username,
      xp: this.hero?.getExperience(),
      className: this.hero?.type
    };
  }

  private async write(account: Partial<Account>): Promise<void> {
    if (NetworkManager.isServer() && NetworkManager.http && this.auth) {
      await NetworkManager.http.post(
        '/update',
        account,
        this.auth
      );
    }
  }

  public isActivePlayer(): boolean {
    return PlayerManager.isActivePlayer(this);
  }

  public send(packet: Data): void {
    if (this.socket > -1) {
      NetworkManager.send(packet, this.socket);
    }
  }

  public disconnect(): void {
    NetworkManager.disconnect(this.socket);
  }

  public setClass(type: string): boolean {
    const newHero = WorldManager.createEntity(type);
    if (newHero instanceof Hero) {
      if (this.hero) {
        newHero.setPosition(this.hero.position);
        newHero.setColor(this.hero.getColor());
        newHero.setExperience(this.hero.getExperience());
        newHero.setLife(this.hero.getLife());
        newHero.angle = this.hero.angle;
        this.hero.markForDelete();
      }
      WorldManager.add(newHero);
      this.setHero(newHero);
      return true;
    } else {
      return false;
    }
  }
}
