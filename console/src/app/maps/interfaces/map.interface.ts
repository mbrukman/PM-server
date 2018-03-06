import { IAgent } from '@agents/interfaces/agent.interface';
import { Group } from '@agents/models';

export interface IMap {
  id?: string,
  name: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
  licence?: string,
  archived: boolean,
  agents?: [IAgent],
  groups?: Group[],
  queue?: number
}
