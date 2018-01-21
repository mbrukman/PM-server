import { IPlugin } from "../../plugins/interfaces/plugin.interface";
import { IPluginMethod } from "../../plugins/interfaces/plugin-method.interface";
import { IPluginMethodParam } from "../../plugins/interfaces/plugin-method-param.interface";
import { IMap } from "./map.interface";

export interface ITriggerActionParam {
  value: string,
  viewName: string,
  param: string | IPluginMethodParam,
  name: string
}

export interface IMapTrigger {
  id?: string,
  _id?: string,
  map: string | IMap;
  name: string,
  description?: string,
  createdAt?: Date,
  active?: boolean,
  plugin: string | IPlugin,
  method: string | IPluginMethod,
  params: [ITriggerActionParam]
}

