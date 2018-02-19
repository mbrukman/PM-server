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

/**
 * Filter param model
 */
export class FilterParam {
  constructor(private value?: string | boolean, private filterType?: FILTER_TYPES) {
    this.value = value;
    this.filterType = this.filterType || FILTER_TYPES.equal;
  }
}

export class Group {
  id?: string;
  _id?: string;
  name: string;
  agents?: string[] | Agent[];
  filter?: {
    hostname?: FilterParam[],
    arch?: FilterParam[],
    alive?: FilterParam,
    freeSpace?: FilterParam[],
    respTime?: FilterParam[],
    ip?: FilterParam[],
    created?: FilterParam[],
  };

  constructor() {
    this.filter = {
      hostname: [],
      arch: [],
      freeSpace: [],
      respTime: [],
      ip: [],
      created: []
    };
  }

  isPopulated() {
    return !!(this.agents && typeof this.agents[0] === 'object');
  }

  hasAgents() {
    return !!(this.agents && this.agents.length > 0);

  }
}


