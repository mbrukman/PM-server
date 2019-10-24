import {Agent} from '../../services/agent/agent.model';

/**
 * Filter types for dynamic filter group.
 */


export const FILTER_TYPES = [
  {label: 'Greater Than Or Equal', id: 'gte'},
  {label: 'Greater Than', id: 'gt'},
  {label: 'Equal', id: 'equal'},
  {label: 'Contains', id: 'contains'},
  {label: 'Less Than Or Equal', id: 'lte'},
  {label: 'Less Than', id: 'lt'}

];

export const FILTER_FIELDS = [
  {label: 'Hostname', id: 'hostname'},
  {label: 'Archive', id: 'arch'},
  {label: 'Alive', id: 'alive'},
  {label: 'Free Space', id: 'freeSpace'},
  {label: 'Response Time', id: 'respTime'},
  {label: 'Url', id: 'url'},
  {label: 'Created At', id: 'createdAt'},
];

/**
 * Filter param model
 */
export class AgentsGroupFilter {
  field: string;
  value: string;
  filterType: string = 'equal';
}

export class Group {
  id?: string;
  _id?: string;
  name: string;
  agents?: string[] | Agent[];
  filters?: [AgentsGroupFilter];


  isPopulated?() {
    return !!(this.agents && typeof this.agents[0] === 'object');
  }

  hasAgents?() {
    return !!(this.agents && this.agents.length > 0);
  }
}


