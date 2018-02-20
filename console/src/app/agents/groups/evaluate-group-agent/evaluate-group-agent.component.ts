import { Component, Input, OnInit } from '@angular/core';

import { FILTER_TYPES, FilterParam, Group } from '@agents/models/group.model';
import { Agent } from '@agents/models/agent.model';
import { AgentsService } from '@agents/agents.service';

@Component({
  selector: 'app-evaluate-group-agent',
  templateUrl: './evaluate-group-agent.component.html',
  styleUrls: ['./evaluate-group-agent.component.scss']
})
export class EvaluateGroupAgentComponent implements OnInit {
  @Input('group') group: Group;
  @Input('agents') agents: Agent[];
  filters: FilterParam[];
  filteredAgents: Agent[] = [];

  constructor(private agentsService: AgentsService) { }

  ngOnInit() {
    if (!this.group.filters || this.group.filters.length === 0) {
      return;
    }
    this.filteredAgents = [...this.agents];
    this.filterAgents(this.group.filters);

    this.agentsService.getGroupToReEvalueateAsObservable()
      .filter(group => group.id === this.group.id)
      .subscribe(group => {
        this.group = group;
        this.filteredAgents = [...this.agents];
        this.filterAgents(group.filters);
      });
  }

  filterAgents(filters: FilterParam[]) {
    filters.forEach(f => {
      this.evaluateFilter(f);
    });
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
