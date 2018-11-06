import { IPluginMethod } from '@plugins/interfaces/plugin-method.interface';
import { IAction, IMapStructure, IProcess } from './map-structure.interface';
import { IAgent } from '@agents/interfaces/agent.interface';
import { IMap } from './map.interface';
import { MapStructureConfiguration } from '@maps/models';


export interface IActionResult {
  name?: String;
  action?: string | IAction;
  method?: { name: string, _id: string | IPluginMethod };
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
}


export interface IProcessResult {
  name?: string;
  index: number;
  process: string | IProcess;
  uuid: string;
  plugin: string;
  actions?: [IActionResult];
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
}

export interface IAgentResult {
  name: string;
  processes?: [IProcessResult];
  agent: string | IAgent;
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
}

export interface IMapResult {
  map: string | IMap;
  runId: string;
  structure: string | IMapStructure;
  agentsResults?: [IAgentResult];
  configuration: MapStructureConfiguration;
  cleanFinish?: boolean;
  startTime: Date;
  finishTime: Date;
  trigger?: string;
}
