import {ChatManager} from 'server/chat/ChatManager';
import {Player} from 'core/player';

export interface CommandEntry {
  name: string;
  handler: (player: Player, ...args: string[]) => void;
  help: string;
  permissionLevel?: number;
  aliases?: [];
}

const CM = new ChatManager();
export {CM as ChatManager};
