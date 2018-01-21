import { Map } from "./map.model";
import { IMapTrigger, ITriggerActionParam } from "../interfaces/map-trigger.interface";
import { Plugin } from "../../plugins/models/plugin.model";
import { PluginMethod } from "../../plugins/models/plugin-method.model";
import { PluginMethodParam } from "../../plugins/models/plugin-method-param.model";

export class TriggerActionParam implements ITriggerActionParam {
  value: string;
  viewName: string;
  param: string | PluginMethodParam;
  name: string;
}

export class MapTrigger implements IMapTrigger {
  id?: string;
  _id?: string;
  map: string | Map;
  name: string;
  description?: string;
  createdAt?: Date;
  active?: boolean;
  plugin: string | Plugin;
  method: string | PluginMethod;
  params: [TriggerActionParam]
}

