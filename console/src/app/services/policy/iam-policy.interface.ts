import { Permissions } from './permissions.interface';
import { User } from '../users/user.model';

export interface IAMPolicy {
  _id?: string;
  permissions: Permissions;
  user?: User;
}
