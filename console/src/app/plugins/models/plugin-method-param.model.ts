import { IPluginMethodParam } from "../interfaces/plugin-method-param.interface";

export class PluginMethodParam implements IPluginMethodParam {
  id?: string;
  _id?: string;
  name: string;
  type: string;
  viewName?: string;
  options?: [{ id: string, value: string }];
  value?: string | { id: string, value: string };
  code?: boolean;
  query?: object;
  model?: string

}
