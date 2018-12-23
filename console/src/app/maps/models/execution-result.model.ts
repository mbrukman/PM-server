import { Map } from './map.model';
import { Action, MapStructureConfiguration, MapStructure, Process } from '.';
import { IActionResult, IAgentResult, IMapResult, IProcessResult } from '../interfaces/execution-result.interface';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { Agent } from '@agents/models/agent.model';


export class ActionResult implements IActionResult {
  name?: String;
  action?: string | Action;
  method?: { name: string; _id: string | PluginMethod };
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
}


export class ProcessResult implements IProcessResult {
  name?: string;
  index: number;
  process: string | Process;
  uuid: string;
  plugin: string;
  actions?: [ActionResult];
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
  //TODO: move to wrapper
  agentKey : string;
}

export class AgentResult implements IAgentResult {
  name: string;
  processes?: [ProcessResult];
  agent: string | Agent;
  status: string;
  startTime: Date;
  finishTime: Date;
  result: any;
}

export class MapResult implements IMapResult {
  id?: string;
  _id?: string;
  map: string | Map;
  runId: string;
  structure: string | MapStructure;
  agentsResults?: [AgentResult];
  configuration: MapStructureConfiguration;
  cleanFinish?: boolean;
  startTime: Date;
  finishTime: Date;
  trigger?: string;
}
