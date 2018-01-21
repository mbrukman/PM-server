import { IPluginMethod } from "../../plugins/interfaces/plugin-method.interface";
import { IAction, IMapStructure, IProcess } from "./map-structure.interface";
import { IPlugin } from "../../plugins/interfaces/plugin.interface";
import { IAgent } from "../../agents/interfaces/agent.interface";
import { IMap } from "./map.interface";


export interface IActionResult {
  name?: String,
  action?: string | IAction,
  method?: { name: string, _id: string | IPluginMethod },
  status: string,
  startTime: Date,
  finish: Date,
  result: any
}


export interface IProcessResult {
  name?: string,
  process: string | IProcess,
  uuid: string,
  plugin: { name?: string, _id: string | IPlugin },
  actions?: [IActionResult],
  status: string,
  startTime: Date,
  finish: Date,
  result: any
}

export interface IAgentResult {
  name: string,
  processes?: [IProcessResult],
  agent: string | IAgent,
  status: string,
  startTime: Date,
  finish: Date,
  result: any
}

export interface IMapResult {
  map: string | IMap,
  runId: string,
  structure: string | IMapStructure,
  agentsResults?: [IAgentResult],
  startAgentsNumber: number,
  startTime: Date,
  finishTime: Date,
}
