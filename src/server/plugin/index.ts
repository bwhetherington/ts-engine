export * from 'server/plugin/plugin';
import {PluginManager} from 'server/plugin/manager';

const PM = new PluginManager();
export {PM as PluginManager};
