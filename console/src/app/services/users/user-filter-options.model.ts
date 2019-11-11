import {FilterOptions} from '@shared/model/filter-options.model';

export default class UserFilterOptions extends FilterOptions {
  public notInGroup?: string;
  constructor(filterData = {} as UserFilterOptions) {
    super(filterData);
    const {notInGroup} = filterData;
    this.notInGroup = notInGroup;
  }
}
