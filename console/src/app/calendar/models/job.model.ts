import { Project } from '@projects/models/project.model';
import { Map } from '@maps/models';

export class Job {
  project: string | Project;
  map: string | Map;
  type: string;
  datetime?: Date;
  cron?: string;
  configuration?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

