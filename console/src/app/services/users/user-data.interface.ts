import UserGroup from '@app/services/user-group/user-group.model';

export default interface UserDataInterface {
    name: string;
    email: string;
    createdAt: Date;
    phoneNumber: string;
    groups: Array<UserGroup | string>;
    changePasswordOnNextLogin: boolean;
}

export interface UserDataPatchableInterface {
  name?: string;
  email?: string;
  createdAt?: Date;
  phoneNumber?: string;
  groups?: Array<UserGroup>;
  changePasswordOnNextLogin?: boolean;
}
