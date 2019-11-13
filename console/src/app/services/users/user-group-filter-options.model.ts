import {FilterOptions} from '@shared/model/filter-options.model';

export default class UserGroupFilterOptions extends FilterOptions {
  public notInUsers?: string;
  constructor(filterData = {} as UserGroupFilterOptions) {
    super(filterData);
    const {notInUsers} = filterData;
    this.notInUsers = notInUsers;
  }
}
