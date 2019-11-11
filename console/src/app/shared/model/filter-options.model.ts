export class FilterOptions {
  globalFilter?: string;
  isArchived?: boolean;
  sort?: string = '-createdAt';
  limit?: number;
  filter?: any;
  page?: number = 1;

  constructor(filterData = {} as FilterOptions) {
    const {globalFilter, isArchived, sort, limit, filter, page} = filterData;
    this.globalFilter = globalFilter;
    this.isArchived = isArchived;
    this.sort = sort || '-createdAt';
    this.limit = limit;
    this.filter = filter;
    this.page = page;
  }
}
