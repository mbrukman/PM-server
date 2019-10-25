import {IMap} from '../interfaces/map.interface';
import {Group} from '@agents/models';
import {Serializable} from '@core/models/serializable.model';
import {MapResult} from '../models/execution-result.model';
import {Agent} from '@app/services/agent/agent.model';

export class Map extends Serializable implements IMap {
  _id?: string;
  id?: string;
  name: string;
  description?: string = '';
  createdAt?: Date;
  updatedAt?: Date;
  archived: boolean;
  agents?: Agent[];
  groups?: Group[];
  project: { name: string, id: string };
  latestExectionResult?: MapResult;
  queue?: number;
  processResponse: string;
  apiResponseCodeReference: string;
}
