import { Map } from './map.model';
import { ITriggerActionParam } from '../interfaces/map-trigger.interface';
import { PluginMethod, PluginMethodParam } from '@plugins/models';


export class TriggerActionParam implements ITriggerActionParam {
  value: string;
  viewName: string;
  param: string | PluginMethodParam;
  name: string;
}

export class MapTrigger {
  id?: string;
  _id?: string;
  map: string | Map;
  name: string;
  description?: string;
  configuration?: string;
  createdAt?: Date;
  active?: boolean;
  plugin: string | Plugin;
  method: string | PluginMethod;
  params: [TriggerActionParam]
}

