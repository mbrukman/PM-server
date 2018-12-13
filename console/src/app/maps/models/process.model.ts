import { FormGroup, FormControl, FormArray } from '@angular/forms';

import { Serializable } from '@core/models/serializable.model';
import { Plugin } from '@plugins/models/plugin.model';

import { IProcess } from '../interfaces/map-structure.interface';
import { UsedPlugin } from './used-plugin.model';
import { Action } from './action.model';

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
  isPluginExist?: boolean

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
