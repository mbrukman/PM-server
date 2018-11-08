import { IMap } from '../interfaces/map.interface';
import { Agent, Group } from '@agents/models';
import { Project } from '@projects/models/project.model';

export class Map implements IMap {
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
  project:{name: String, id:String};
  queue?: number;
}
