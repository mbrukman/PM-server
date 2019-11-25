import { IAMPermissions } from './iam-permissions.interface';
import { User } from '../users/user.model';
import { BasicPolicy } from '../interfaces/basic-policy.interface';

export interface IAMPolicy extends BasicPolicy {
  user?: User;
  permissions: IAMPermissions;
}
