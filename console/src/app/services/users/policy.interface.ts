import { Permissions } from './permissions.interface';
import { User } from './user.model';

export interface Policy {
  _id: string;
  permissions: Permissions;
  user: User;
}
