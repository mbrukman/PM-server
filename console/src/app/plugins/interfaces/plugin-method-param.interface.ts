export interface IPluginMethodParam {
  id?: string,
  _id?: string,
  name: string,
  viewName?: string,
  type: string,
  options?: [{ id: string, name: string }],
  value?: string | { id: string, value: string };
  code?: boolean,
  query?: object,
  model?: string
}

