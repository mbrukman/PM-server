import { IPlugin } from '../interfaces/plugin.interface';
import { PluginMethod } from './plugin-method.model';
import {PluginSettings} from './plugin-settings.model'
import { Serializable } from '@core/models/serializable.model'

import { environment } from '@env/environment';

export class Plugin extends Serializable implements IPlugin {
  id?: string;
  _id?: string;
  name: string;
  main: string;
  type: string;
  description?: string;
  execProgram: string;
  active: boolean;
  version: string;
  imgUrl?: string;
  methods?: [PluginMethod];
  settings?:[PluginSettings]

  get fullImageUrl(){
    return `${environment.serverUrl}plugins/${this.name}/${this.imgUrl}`;
  }
}
