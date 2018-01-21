import {IPluginMethod} from "./plugin-method.interface";

export interface IPlugin {
  name: string,
  type: string,
  main: string,
  description?: string,
  execProgram: string,
  active: boolean,
  version?: string,
  imgUrl?: string,
  methods?: [IPluginMethod]
}
