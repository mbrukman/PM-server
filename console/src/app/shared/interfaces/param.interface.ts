export interface IParam {
  _id? : string;
  name: string,
  viewName?: string,
  value?: string | { id: string, value: string };
  type?:string
}

