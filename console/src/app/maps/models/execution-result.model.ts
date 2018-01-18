import { Map } from "./map.model";
import { Action, MapStructure, Process } from "./map-structure.model";
import { IActionResult, IAgentResult, IMapResult, IProcessResult } from "../interfaces/execution-result.interface";
import { PluginMethod } from "../../plugins/models/plugin-method.model";
import { Agent } from "../../agents/models/agent.model";
import { Plugin } from "../../plugins/models/plugin.model";


export class ActionResult implements IActionResult {
  name?: String;
  action?: string | Action;
  method?: { name: string; _id: string | PluginMethod };
  status: string;
  startTime: Date;
  finish: Date;
  result: any;
}


export class ProcessResult implements IProcessResult {
  name?: string;
  process: string | Process;
  uuid: string;
  plugin: { name?: string; _id: string | Plugin };
  actions?: [ActionResult];
  status: string;
  startTime: Date;
  finish: Date;
  result: any;
}

export class AgentResult implements IAgentResult {
  name: string;
  processes?: [ProcessResult];
  agent: string | Agent;
  status: string;
  startTime: Date;
  finish: Date;
  result: any;
}

export class MapResult implements IMapResult {
  id?: string;
  _id?: string;
  map: string | Map;
  runId: string;
  structure: string | MapStructure;
  agentsResults?: [AgentResult];
  startAgentsNumber: number;
  startTime: Date;
  finishTime: Date;
}
