import { Project } from '@projects/models/project.model';
import {Map} from '@app/services/map/models/map.model';

export class Job {
  project: string | Project;
  map: string | Map;
  type: string;
  datetime?: Date;
  cron?: string;
  configuration?: string;
  createdAt?: Date;
  updatedAt?: Date;
  skip?: boolean;
}

