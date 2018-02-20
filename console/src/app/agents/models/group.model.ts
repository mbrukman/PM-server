import { Agent } from './agent.model';

/**
 * Filter types for dynamic filter group.
 */
export enum FILTER_TYPES {
  gte = 'gte',
  gt = 'gt',
  equal = 'equal',
  contains = 'contains',
  lte = 'lte',
  lt = 'lt'
}

export enum FILTER_FIELDS {
  hostname = 'hostname',
  arch = 'arch',
  alive = 'alive',
  freeSpace = 'freeSpace',
  respTime = 'respTime',
  url = 'url',
  createdAt = 'createdAt'

}

/**
 * Filter param model
 */
export class FilterParam {
  constructor(public field: FILTER_FIELDS, public value?: string, public filterType?: FILTER_TYPES) {
    this.field = field;
    this.value = value;
    this.filterType = this.filterType || FILTER_TYPES.equal;
  }
}

export class Group {
  id?: string;
  _id?: string;
  name: string;
  agents?: string[] | Agent[];
  filters?: [FilterParam];


  isPopulated?() {
    return !!(this.agents && typeof this.agents[0] === 'object');
  }

  hasAgents?() {
    return !!(this.agents && this.agents.length > 0);

  }
}


