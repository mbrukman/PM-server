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

  getFormGroup(): FormGroup {
    return new FormGroup({
      code: new FormControl(this.code),
      value: new FormControl(this.value),
      param: new FormControl(this._id),
      viewName: new FormControl(this.viewName),
      name: new FormControl(this.name),
      type: new FormControl(this.type)
    });
  }

}
