import { IMap } from '../interfaces/map.interface';
import { Agent, Group } from '@agents/models';
import { Serializable } from '@core/models/serializable.model';

export class Map extends Serializable implements IMap {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  licence?: string;
  archived: boolean;
  agents?: Agent[];
  groups?: Group[];
  project?: string;
  queue?: number;
}
