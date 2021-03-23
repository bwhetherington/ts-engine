import {ServerChatManager} from 'server/chat/manager';
import {Player} from 'core/player';

export interface CommandEntry {
  name: string;
  handler: (player: Player, ...args: string[]) => void;
  help: string;
  permissionLevel?: number;
  aliases?: [];
}

const CM = new ServerChatManager();
export {CM as ChatManager};
