import UserGroup from '@app/services/user-group/user-group.model';
import UserDataInterface from '@app/services/users/user-data.interface';
import { Permissions } from './permissions.interface';

export class User implements UserDataInterface {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  phoneNumber: string;
  groups: Array<UserGroup | string>;
  changePasswordOnNextLogin: boolean;
  iamPolicy: {
    _id: string,
    permissions: Permissions
  };

  constructor(userData = {} as UserDataInterface) {
    // @ts-ignore
    const { _id, name, email, phoneNumber, createdAt, groups } = userData;
    this._id = _id;
    this.name = name;
    this.email = email;
    this.phoneNumber = phoneNumber;
    if (createdAt) {
      this.createdAt = new Date(createdAt);
    }
    this.groups = this.mapGroups(groups);
  }
  private mapGroups(groups = [] as Array<UserGroup | string>) {
    return groups.map(group => {
      if (typeof group !== 'string') {
        return new UserGroup(group);
      }
      return group;
    });
  }
}
