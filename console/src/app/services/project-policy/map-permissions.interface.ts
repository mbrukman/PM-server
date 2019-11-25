import { BasicPermissions } from '../interfaces/basic-permissions.interface';

export interface MapPermissions extends BasicPermissions {
  archive: boolean;
  execute: boolean;
}
