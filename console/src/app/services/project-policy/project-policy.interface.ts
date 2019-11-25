import { User } from '../users/user.model';
import { ProjectPermissions } from './project-permissions.interface';
import { Project } from '@app/projects/models/project.model';
import { Map } from '../map/models/map.model';
import { MapPermissions } from './map-permissions.interface';
import { BasicPolicy } from '../interfaces/basic-policy.interface';

export interface ProjectPolicy extends BasicPolicy {
  _id?: string;
  projects: {
    project: Project;
    permissions: ProjectPermissions;
    maps: {
      map: Map,
      permissions: MapPermissions
    }[];
  }[];
  user?: User;
}
