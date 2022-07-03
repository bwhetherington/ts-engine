import {ServerChatManager} from '@/server/chat/manager';
import {Player} from '@/core/player';

type CommandHandler = (player: Player, ...args: string[]) => void;

export interface CommandEntry {
  name: string;
  handler: (player: Player, ...args: string[]) => void;
  help: string;
  permissionLevel?: number;
  subcommands?: Record<string, CommandHandler>;
  aliases?: string[];
}

const CM = new ServerChatManager();
export {CM as ChatManager};
