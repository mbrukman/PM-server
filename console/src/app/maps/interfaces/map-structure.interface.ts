import { IPluginMethodParam } from '@plugins/interfaces/plugin-method-param.interface';
import { IPluginMethod } from '@plugins/interfaces/plugin-method.interface';
import { IPlugin } from '@plugins/interfaces/plugin.interface';
import { Plugin } from '@plugins/models/plugin.model';
import { IAttribute } from './attribute.interface';

export interface IActionParam {
  id?: string;
  _id?: string;
  value: any;
  code: boolean;
  name?: string;

}

export interface IAction {
  id?: string;
  _id?: string;
  name: string;
  timeout?: number;
  retries?: number;
  order: number;
  mandatory: boolean;
  method: IPluginMethod | string;
  params?: IActionParam[];
  isEnabled: boolean
}

export interface IUsedPlugin {
  _id?: string;
  name: string;
  version: string;
}
export interface IProcess {
  id: string;
  _id?: string;
  name?: string;
  description?: string;
  mandatory?: boolean;
  condition?: string;
  preRun?: string;
  postRun?: string;
  filterAgents?: string;
  coordination?: string;
  flowControl?: string;
  actions: IAction[];
  used_plugin: IUsedPlugin;
  plugin?: IPlugin;
  createdAt: Date;
  updatedAt: Date;
  correlateAgents: boolean;
  uuid: string;
}

export interface ILink {
  id?: string;
  _id?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
  createdAt?: Date;
}

export interface IMapStructure {
  id?: string;
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
  content: any;
  map: string;
  code?: string;
  attributes?: IAttribute[];
  processes?: IProcess[];
  links?: ILink[];
  plugins_names?: string[];
  plugins?: Plugin[];
  used_plugins: IUsedPlugin[];
}
