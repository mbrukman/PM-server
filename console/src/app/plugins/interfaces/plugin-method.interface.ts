import { IPluginMethodParam } from "./plugin-method-param.interface";

export interface IPluginMethod {
  name: string,
  viewName?: string,
  route?: string,
  actionString?: string,
  params?: [IPluginMethodParam],
}
