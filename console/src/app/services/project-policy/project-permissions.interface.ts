import { BasicPermissions } from '../interfaces/basic-permissions.interface';

export interface ProjectPermissions extends BasicPermissions {
  createMap: boolean;
  archive: boolean;
}
