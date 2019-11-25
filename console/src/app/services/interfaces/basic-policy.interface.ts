
import { BasicPermissions } from './basic-permissions.interface';

export interface BasicPolicy {
  _id?: string;
  permissions: BasicPermissions;
}
