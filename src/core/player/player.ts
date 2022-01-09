import {BaseHero, WorldManager} from 'core/entity';
import {Serializable, Data} from 'core/serialize';
import {Socket, NetworkManager} from 'core/net';
import {PlayerManager, Account} from 'core/player';
import {UUIDManager, UUID, isUUID} from 'core/uuid';
import {EventData, Event, Observer} from 'core/event';
import {capitalize} from 'core/util';
import {LogManager} from 'core/log';
import {BasicAuth} from 'core/net/http';
import {randomColor} from 'core/graphics/color';
import {PlayerChatManager} from './chat';
import {TextColor} from 'core/chat';
import {CameraManager} from 'core/graphics';

const log = LogManager.forFile(__filename);

const DEFAULT_ACCOUNT = {
  username: 'Username',
  xp: 0,
  className: 'Hero',
  permissionLevel: 0,
};

export class Player extends Observer implements Serializable {
  public name: string = 'Anonymous';
  public id: UUID;
  public hero?: BaseHero;
  public socket: Socket = -1;
  public hasJoined: boolean = false;
  public ping: number = 0;
  public score: number = 0;
  public chat: PlayerChatManager;

  private auth?: BasicAuth;
  private account: Account = {...DEFAULT_ACCOUNT};

  public constructor(id?: UUID) {
    super();
    if (id) {
      this.id = id;
    } else {
      this.id = UUIDManager.generate();
    }

    this.chat = new PlayerChatManager(this);
  }

  public getPermissionLevel(): number {
    return this.account.permissionLevel ?? 0;
  }

  public isAdmin(): boolean {
    return this.getPermissionLevel() > 0;
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

  public deserialize(data: Data) {
    const {name, id, socket, heroID, score, hasJoined} = data;
    if (isUUID(id)) {
      this.id = id;
    }
    if (typeof name === 'string') {
      this.name = name;
    }
    if (typeof socket === 'number') {
      this.socket = socket;
    }
    if (isUUID(heroID)) {
      const entity = WorldManager.getEntity(heroID);
      if (entity instanceof BaseHero) {
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

  public setHero(hero?: BaseHero) {
    if (hero !== this.hero) {
      this.hero?.markForDelete();
      this.hero = hero;
    }
    if (hero && hero.getPlayer() !== this) {
      hero.setPlayer(this);
    }
  }

  public override async cleanup(): Promise<void> {
    super.cleanup();
    this.hero?.markForDelete();
    UUIDManager.free(this.id);

    log.info('cleanup ' + this.name);
    await this.save();
  }

  public setAuth(auth: BasicAuth) {
    this.auth = auth;
  }

  public getAuth(): BasicAuth | undefined {
    return this.auth;
  }

  public spawnHero(): BaseHero {
    // Delete existing hero if present
    this.hero?.markForDelete();

    const hero = WorldManager.spawnEntity('Hero') as BaseHero;
    hero.setPosition(WorldManager.getRandomPosition());
    hero.setPlayer(this);
    this.setHero(hero);
    const color = randomColor();
    hero.setColor(color);
    hero.setLife(hero.getMaxLife());
    return hero;
  }

  public reset() {
    const blankAccount = {
      ...DEFAULT_ACCOUNT,
      username: this.account.username,
      permissionLevel: this.account.permissionLevel,
    };
    this.load(blankAccount);
  }

  public load(account: Account) {
    this.account = account;
    this.name = capitalize(account.username ?? 'Player');
    this.hasJoined = true;
  }

  public async save(): Promise<void> {
    if (this.auth) {
      const account = this.createAccountUpdate();
      await this.write(account);
      log.info('player ' + this.name + ' saved');
    }
  }

  private createAccountUpdate(): Partial<Account> {
    return {
      username: this.auth?.username?.toLowerCase() ?? '',
      xp: this.hero?.getExperience(),
      className: this.hero?.type,
    };
  }

  private async write(account: Partial<Account>): Promise<void> {
    if (NetworkManager.isServer()) {
      await NetworkManager.http?.post('/update', account);
    }
  }

  public isActivePlayer(): boolean {
    return PlayerManager.isActivePlayer(this);
  }

  public send(packet: Data) {
    if (this.socket > -1) {
      NetworkManager.send(packet, this.socket);
    }
  }

  public sendEvent<T extends EventData>(event: Event<T>) {
    this.send(event);
  }

  public disconnect() {
    NetworkManager.disconnect(this.socket);
  }

  public setClass(type: string): boolean {
    const position = this.hero?.position;
    const newHero = WorldManager.spawnEntity(type, position);
    if (newHero instanceof BaseHero) {
      if (this.hero) {
        newHero.setPosition(this.hero.position);
        newHero.velocity.set(this.hero.velocity);
        newHero.setColor(this.hero.getBaseColor());
        newHero.setExperience(this.hero.getExperience(), false);
        newHero.angle = this.hero.angle;
        newHero.targetAngle = this.hero.targetAngle;
        newHero.weaponAngle = this.hero.weaponAngle;
        newHero.copyMovement(this.hero);
        newHero.replacementId = this.hero.id;
        newHero.storedUpgrades = this.hero.storedUpgrades;

        // Copy upgrades
        newHero.copyUpgrades(this.hero);
        newHero.setLife(this.hero.getLife());

        this.hero.markForDelete();
      }
      WorldManager.add(newHero);
      this.setHero(newHero);
      return true;
    } else {
      return false;
    }
  }

  public getNameColor(): TextColor {
    return this.isAdmin() ? 'blue' : 'none';
  }

  public override toString(): string {
    return `${this.name}(${this.id})`;
  }
}
