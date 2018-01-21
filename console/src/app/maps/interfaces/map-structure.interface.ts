import { IPluginMethodParam } from "../../plugins/interfaces/plugin-method-param.interface";
import { IPluginMethod } from "../../plugins/interfaces/plugin-method.interface";
import { IPlugin } from "../../plugins/interfaces/plugin.interface";
import { IAttribute } from "./attribute.interface";

export interface IActionParam {
  id?: string;
  _id?: string;
  value: string;
  code: boolean;
  viewName?: string;
  name?: string;
  param: IPluginMethodParam | string;
}

export interface IAction {
  id?: string;
  _id?: string;
  name: string,
  timeout?: number,
  timeunit?: number,
  retries?: number,
  order: number,
  mandatory: boolean,
  method: IPluginMethod,
  params?: IActionParam[]
}

export interface IProcess {
  id: string;
  _id?: string;
  name?: string,
  description?: string,
  mandatory?: boolean,
  condition?: string,
  preRun?: string,
  postRun?: string,
  filterAgents?: string,
  actions: IAction[],
  plugin: IPlugin,
  createdAt: Date,
  correlateAgents: boolean,
  uuid: string
}

export interface ILink {
  name?: string,
  correlateAgents?: boolean,
  condition?: string,
  sourceId: string,
  targetId: string,
  uuid?: string
}

export interface IMapStructure {
  id?: string,
  _id?: string,
  createdAt: Date,
  content: any,
  map: string,
  code?: string,
  attributes?: IAttribute[],
  processes?: IProcess[],
  links?: ILink[]

}

