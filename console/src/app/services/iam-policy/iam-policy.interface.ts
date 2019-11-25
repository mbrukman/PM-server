import { IAMPermissions } from './iam-permissions.interface';
import { User } from '../users/user.model';

export interface IAMPolicy {
  _id?: string;
  permissions: IAMPermissions;
  user?: User;
}
