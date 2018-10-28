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
  value: string = null;
  code: boolean = null;
  viewName?: string;
  name?: string;
  param: PluginMethodParam | string;
  type: 'string' | 'text';

  getFormGroup(): FormGroup {
    return new FormGroup({
      code: new FormControl(this.code),
      value: new FormControl(this.value),
      param: new FormControl(this.id),
      viewName: new FormControl(this.viewName),
      name: new FormControl(this.name),
      type: new FormControl(this.type)
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

  getFormGroup(): FormGroup {
    return new FormGroup({
      id: new FormControl(this.id),
      name: new FormControl(this.name),
      timeout: new FormControl(this.timeout),
      retries: new FormControl(this.retries),
      method: new FormControl(this.method),
      mandatory: new FormControl(this.mandatory),
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

  getFormGroup(): FormGroup {
    return new FormGroup({
      name : new FormControl(this.name),
      uuid : new FormControl(this.uuid),
      description : new FormControl(this.description),
      mandatory : new FormControl(this.mandatory),
      condition : new FormControl(this.condition),
      coordination : new FormControl(this.coordination),
      flowControl : new FormControl(this.flowControl),
      preRun : new FormControl(this.preRun),
      postRun : new FormControl(this.postRun),
      correlateAgents : new FormControl(this.correlateAgents),
      filterAgents : new FormControl(this.filterAgents),
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
