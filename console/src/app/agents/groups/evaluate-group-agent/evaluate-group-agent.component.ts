import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { FILTER_TYPES, FilterParam, Group } from '@agents/models/group.model';
import { Agent } from '@agents/models/agent.model';
import { AgentsService } from '@agents/agents.service';

@Component({
  selector: 'app-evaluate-group-agent',
  templateUrl: './evaluate-group-agent.component.html',
  styleUrls: ['./evaluate-group-agent.component.scss']
})
export class EvaluateGroupAgentComponent implements OnInit, OnChanges {
  @Input('group') group: Group;
  @Input('agents') agents: any;
  filters: FilterParam[];
  filteredAgents: Agent[] = [];

  constructor(private agentsService: AgentsService) { }

  ngOnInit() {
    this.agentsService.getGroupToReEvaluateAsObservable()
      .filter(group => group.id === this.group.id)
      .filter(group => !!this.agents || this.agents.length > 0)
      .subscribe(group => {
        let agents = Object.keys(this.agents).map(o => this.agents[o]);
        this.group = group;
        this.filteredAgents = [...agents];
        this.filterAgents(group.filters);
      });
  }

  ngOnChanges(change: SimpleChanges) {
    if (this.agents && Object.keys(this.agents).length > 0) {
      let agents = Object.keys(this.agents).map(o => this.agents[o]);
      this.filteredAgents = [...agents];
      this.filterAgents(this.group.filters);
    }
  }

  filterAgents(filters: FilterParam[]) {
    if (!filters || filters.length === 0) {
      this.filteredAgents = [];
    } else {
      filters.forEach(f => {
        this.evaluateFilter(f);
      });
    }
  }

  evaluateFilter(filter: FilterParam) {
    this.filteredAgents = this.filteredAgents
      .filter(o => {
        switch (filter.filterType) {
          case FILTER_TYPES.equal: {
            if (!o[filter.field]) {
              return false;
            }
            return o[filter.field].toString() === filter.value;
          }
          case FILTER_TYPES.contains: {
            return o[filter.field].includes(filter.value);
          }

          case FILTER_TYPES.gt: {
            try {
              return parseFloat(o[filter.field]) > parseFloat(filter.value);
            } catch (e) {
              return false;
            }
          }

          case FILTER_TYPES.gte: {
            try {
              return parseFloat(o[filter.field]) >= parseFloat(filter.value);
            } catch (e) {
              return false;
            }
          }

          case FILTER_TYPES.lt: {
            try {
              return parseFloat(o[filter.field]) < parseFloat(filter.value);
            } catch (e) {
              return false;
            }
          }

          case FILTER_TYPES.lte: {
            try {
              return parseFloat(o[filter.field]) <= parseFloat(filter.value);
            } catch (e) {
              return false;
            }
          }

          default: {
            return false;
          }
        }
      });
  }

}
