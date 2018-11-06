import { FormGroup, FormControl } from '@angular/forms';

import {IPluginMethodParam} from '../interfaces/plugin-method-param.interface';
import { Serializable } from '@core/models/serializable.model';

export class PluginMethodParam extends Serializable implements IPluginMethodParam {
  id?: string;
  _id?: string;
  name: string;
  type: string;
  viewName?: string;
  options?: [{ id: string, name: string }];
  value?: string | { id: string, value: string } = null;
  code?: boolean = null;
  query?: object;
  model?: string;

  static getFormGroup(param: PluginMethodParam): FormGroup {
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
