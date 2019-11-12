import { User } from '../users/user.model';


export  interface UserGroupDataInterface {
  name: string;
  description: string;
  users?: Array<string | User>;
}


export  interface UserGroupPatchableDataInterface {
  name?: string;
  description?: string;
  users?: Array<string | User>;
}
