import {FormGroup, FormControl} from '@angular/forms';
import {PluginMethodParam} from '@plugins/models/plugin-method-param.model';
import {
  IActionParam,
} from '../interfaces/map-structure.interface';

import {Serializable} from '@core/models/serializable.model';

export class ActionParam extends Serializable implements IActionParam {
  id?: string;
  _id?: string;
  value: any = undefined;
  code: boolean = undefined;
  viewName?: string;
  name?: string;
  param: PluginMethodParam | string;
  type: 'string' | 'text';

  static getFormGroup(param?: ActionParam): FormGroup {
    if (!param) {
      param = new ActionParam();
    }

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
