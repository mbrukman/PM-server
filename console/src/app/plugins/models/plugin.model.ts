import { IPlugin } from "../interfaces/plugin.interface";
import { PluginMethod } from "./plugin-method.model";

export class Plugin implements IPlugin {
  id?: string;
  _id?: string;
  name: string;
  main: string;
  type: string;
  description?: string;
  execProgram: string;
  active: boolean;
  version?: string;
  imgUrl?: string;
  methods?: [PluginMethod]
}
