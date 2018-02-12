import {
  IAction,
  IActionParam,
  ILink,
  IMapStructure,
  IProcess, IUsedPlugin
} from '../interfaces/map-structure.interface';
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { Plugin } from '@plugins/models/plugin.model';
import { IAttribute } from '../interfaces/attribute.interface';


export class ActionParam implements IActionParam {
  id?: string;
  _id?: string;
  value: string;
  code: boolean;
  viewName?: string;
  name?: string;
  param: PluginMethodParam | string;
}

export class Action implements IAction {
  id?: string;
  _id?: string;
  name: string;
  timeout?: number;
  timeunit?: number;
  retries?: number;
  order: number;
  mandatory: boolean;
  method: PluginMethod | string;
  params?: ActionParam[];
}

export class UsedPlugin implements IUsedPlugin{
  _id?: string;
  name: string;
  version: string;
}

export class Process implements IProcess {
  id: string;
  _id?: string;
  name?: string;
  description?: string;
  mandatory?: boolean;
  condition?: string;
  preRun?: string;
  postRun?: string;
  filterAgents?: string;
  coordination?: 'wait' | 'race' | 'each';
  actions: Action[];
  used_plugin: UsedPlugin;
  plugin?: Plugin;
  createdAt: Date;
  updatedAt: Date;
  correlateAgents: boolean;
  uuid: string;
}

export class Link implements ILink {
  id?: string;
  _id?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
  createdAt?: Date;
}

export class Attribute implements IAttribute {
  name: string;
  type: string;
  value: any;
}

export class MapStructure implements IMapStructure {
  id?: string;
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
  map: string;
  content: any;
  code?: string;
  attributes?: Attribute[];
  processes?: Process[];
  links?: Link[];
  plugins?: Plugin[];
  used_plugins: [UsedPlugin];

  constructor() {
    this.processes = [];
    this.attributes = [];
    this.links = [];
  }
}
