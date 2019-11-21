import { User } from '../users/user.model';
import { IAMPolicy } from '../policy/iam-policy.interface';


export default class UserGroup {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  description: string;
  users: Array<User | string>;
  iamPolicy: IAMPolicy;

  // tslint:disable-next-line: variable-name
  constructor(userGroup = {} as UserGroup) {
    const { _id, name, description, users } = userGroup;
    this._id = _id;
    this.name = name;
    this.description = description;
    this.users = this.mapUsers(users);
  }
  private mapUsers(users = [] as Array<User | string>) {
    return users.map(user => {
      if (typeof user !== 'string') {
        return new User(user);
      }
      return user;
    });
  }
}
