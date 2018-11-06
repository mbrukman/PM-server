import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { Plugin } from '@plugins/models/plugin.model';
import {
  IAction,
  IActionParam,
  ILink,
  IMapStructure,
  IProcess,
  IUsedPlugin
} from '../interfaces/map-structure.interface';

import { Serializable } from '@core/models/serializable.model';

export class ActionParam extends Serializable implements IActionParam {
  id?: string;
  _id?: string;
  value: string = undefined;
  code: boolean = undefined;
  viewName?: string;
  name?: string;
  param: PluginMethodParam | string;
  type: 'string' | 'text';

  static getFormGroup(param?: ActionParam): FormGroup {
    if(!param) param = new ActionParam();

    return new FormGroup({
      code: new FormControl(param.code),
      value: new FormControl(param.value),
      param: new FormControl(param._id),
      viewName: new FormControl(param.viewName),
      name: new FormControl(param.name),
      type: new FormControl(param.type)
    });
  }
}

export class Action extends Serializable implements IAction {
  id?: string;
  _id?: string;
  name: string;
  timeout?: number;
  retries: number = 0;
  order: number;
  mandatory: boolean;
  method: PluginMethod | string;
  params?: ActionParam[];

  static getFormGroup(action?: Action): FormGroup {
    if(!action) action = new Action();
    return new FormGroup({
      id: new FormControl(action._id),
      name: new FormControl(action.name),
      timeout: new FormControl(action.timeout),
      retries: new FormControl(action.retries),
      method: new FormControl(action.method),
      mandatory: new FormControl(action.mandatory),
      params: new FormArray([]),
    });
  }
}

export class UsedPlugin implements IUsedPlugin {
  _id?: string;
  name: string;
  version: string;
}

export class Process extends Serializable implements IProcess {
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
  flowControl: 'wait' | 'race' | 'each';
  actions: Action[];
  used_plugin: UsedPlugin;
  plugin?: Plugin;
  createdAt: Date;
  updatedAt: Date;
  correlateAgents: boolean;
  uuid: string;

  constructor(json?: any) {
    super(json);
    this.flowControl = 'each';
  }

  static getFormGroup(process?: Process): FormGroup {
    return new FormGroup({
      name : new FormControl(process.name),
      uuid : new FormControl(process.uuid),
      description : new FormControl(process.description),
      mandatory : new FormControl(process.mandatory),
      condition : new FormControl(process.condition),
      coordination : new FormControl(process.coordination),
      flowControl : new FormControl(process.flowControl),
      preRun : new FormControl(process.preRun),
      postRun : new FormControl(process.postRun),
      correlateAgents : new FormControl(process.correlateAgents),
      filterAgents : new FormControl(process.filterAgents),
      actions: new FormArray([])
    });
  }
}

export class Link implements ILink {
  id?: string;
  _id?: string;
  sourceId: string;
  targetId: string;
  uuid?: string;
  createdAt?: Date;
}

export class Configuration {
  name: string;
  value: object | string;
  selected?: boolean;

  constructor(name?, value?) {
    this.name = name;
    this.value = value;
  }
}

export class MapStructure implements IMapStructure {
  id?: string;
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
  map: string;
  content: any;
  code?: string;
  configurations?: Configuration[];
  processes?: Process[];
  links?: Link[];
  plugins?: Plugin[];
  used_plugins: UsedPlugin[];

  constructor() {
    this.processes = [];
    this.configurations = [];
    this.links = [];

  }
}
