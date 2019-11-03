import { User } from '@app/users-management/models/user.model';

export default interface UserGroupDataInterface {
  name: string;
  description: string;
  users?: Array<string | User>;
}
