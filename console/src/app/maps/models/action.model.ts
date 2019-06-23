import { FormGroup, FormControl, FormArray } from '@angular/forms';

import { Serializable } from '@core/models/serializable.model';
import { PluginMethod } from '@plugins/models/plugin-method.model';

import { IAction } from '../interfaces/map-structure.interface';
import { ActionParam } from './action-param.model';

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
  isEnabled: boolean
  numParallel?: string; 

  static getFormGroup(action?: Action): FormGroup {
    if (!action) {
      action = new Action();
    }
    return new FormGroup({
      id: new FormControl(action._id),
      name: new FormControl(action.name),
      timeout: new FormControl(action.timeout),
      retries: new FormControl(action.retries),
      method: new FormControl(action.method),
      mandatory: new FormControl(action.mandatory),
      params: new FormArray([]),
      isEnabled: new FormControl(action.isEnabled == null ? true : action.isEnabled),
      numParallel: new FormControl(action.numParallel)
    });
  }
}
