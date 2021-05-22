export * from 'server/plugin/plugin';
export * from 'server/plugin/fsm';
export * from 'server/plugin/utils';
import {PluginManager} from 'server/plugin/manager';

const PM = new PluginManager();
export {PM as PluginManager};
