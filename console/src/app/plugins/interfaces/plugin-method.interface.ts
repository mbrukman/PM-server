import { IPluginMethodParam } from "./plugin-method-param.interface";

export interface IPluginMethod {
  id?: string,
  _id?: string,
  name: string,
  viewName?: string,
  route?: string,
  actionString?: string,
  params?: [IPluginMethodParam],
}
