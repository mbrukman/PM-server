import { FormGroup, FormControl } from '@angular/forms';

import {IPluginMethodParam} from '../interfaces/plugin-method-param.interface';
import { Serializable } from '@core/models/serializable.model';
import { ActionParam } from '@maps/models';

export class PluginMethodParam extends Serializable implements IPluginMethodParam {
  id?: string;
  _id?: string;
  name: string;
  valueType?: string;
  type:string
  viewName?: string;
  options?: [{ id: string, name: string }];
  value?: string | { id: string, value: string } = null;
  code?: boolean = null;
  query?: object;
  model?: string;

  static getFormGroup(param: PluginMethodParam, paramInUse = new ActionParam()): FormGroup {
    return new FormGroup({
      code: new FormControl(paramInUse.code),
      value: new FormControl(paramInUse.value),
      param: new FormControl(paramInUse._id),
      viewName: new FormControl(param.viewName),
      name: new FormControl(param.name),
      type: new FormControl(param.type)
    });
  }

}
