import { IPluginMethod } from "../interfaces/plugin-method.interface";
import { PluginMethodParam } from "./plugin-method-param.model";

export class PluginMethod implements IPluginMethod {
  id?: string;
  _id: string;
  name: string;
  viewName?: string;
  route?: string;
  actionString?: string;
  params?: [PluginMethodParam];
}
