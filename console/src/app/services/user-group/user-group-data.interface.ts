import { User } from '../users/user.model';


export default interface UserGroupDataInterface {
  name: string;
  description: string;
  users?: Array<string | User>;
}
