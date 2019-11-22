import { User } from '../users/user.model';
import { ProjectPermissions } from './project-permissions.interface';
import { Project } from '@app/projects/models/project.model';

export interface ProjectPolicy {
  _id?: string;
  projects: {
    project: Project;
    permissions: ProjectPermissions;
    maps: []; // TODO
  }[];
  user?: User;
}
