import {
  IAction,
  IActionParam,
  ILink,
  IMapStructure,
  IProcess
} from '../interfaces/map-structure.interface';
import { PluginMethodParam } from '../../plugins/models/plugin-method-param.model';
import { PluginMethod } from '../../plugins/models/plugin-method.model';
import { Plugin } from '../../plugins/models/plugin.model';
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
  method: PluginMethod;
  params?: ActionParam[];
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
  actions: Action[];
  plugin: Plugin;
  createdAt: Date;
  correlateAgents: boolean;
  uuid: string;
}

export class Link implements ILink {
  name?: string;
  correlateAgents?: boolean;
  condition?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
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
  map: string;
  content: any;
  code?: string;
  attributes?: Attribute[];
  processes?: Process[];
  links?: Link[];

  constructor() {
    this.processes = [];
    this.attributes = [];
    this.links = [];
  }
}
