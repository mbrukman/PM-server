export interface IPluginMethodParam {
  id?: string;
  name: string,
  viewName?: string,
  type: string,
  options?: [{ id: string, name: string }],
  value?: string | { id: string, name: string };
  code?: boolean;
}

