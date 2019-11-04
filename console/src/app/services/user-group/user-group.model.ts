import {User} from '@app/users-management/models/user.model';

export default class UserGroup {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  description: string;
  users: Array<User>;

  // tslint:disable-next-line: variable-name
  constructor (_id: string, name: string, description: string, users: Array<User>) {
    this._id = _id;
    this.name = name;
    this.description = description;
    this.users = users.map(user => new User(user));
  }
}
