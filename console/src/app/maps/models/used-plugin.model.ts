import { FormGroup, FormControl } from '@angular/forms';
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { IUsedPlugin } from '../interfaces/map-structure.interface';

export class UsedPlugin implements IUsedPlugin {
  _id?: string;
  name: string;
  version: string;
}
