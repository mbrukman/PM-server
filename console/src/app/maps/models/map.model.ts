import { IMap } from '../interfaces/map.interface';
import { Agent, Group } from '@agents/models';

export class Map implements IMap {
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  licence?: string;
  archived: boolean;
  agents?: [Agent];
  groups?: Group[];
  project?: string;
  queue?: number;
}
