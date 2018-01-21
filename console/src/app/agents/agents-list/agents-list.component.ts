import { Component, OnDestroy, OnInit } from '@angular/core';

import { AgentsService } from "../agents.service";
import { Agent } from "../models/agent.model";

@Component({
  selector: 'app-agents-list',
  templateUrl: './agents-list.component.html',
  styleUrls: ['./agents-list.component.scss']
})
export class AgentsListComponent implements OnInit, OnDestroy {
  agents: [Agent];
  selectedAgent: Agent;
  agentsReq: any;
  updateReq: any;
  items: any[];

  constructor(private agentsService: AgentsService) {
  }

  ngOnInit() {
    this.agentsReq = this.agentsService.list().subscribe(agents => {
      this.agents = agents;
    });
    this.items = [
      { label: 'View', icon: 'fa-search', command: (event) => console.log("!") },
      { label: 'Delete', icon: 'fa-close', command: (event) => console.log("@") }
    ];
  }

  ngOnDestroy() {
    this.agentsReq.unsubscribe();
    if (this.updateReq)
      this.updateReq.unsubscribe();
  }

  deleteAgent(agentId) {
    this.agentsService.delete(agentId).subscribe(() => {
      let i = this.agents.findIndex((o) => {
        return o._id === agentId
      });
      this.agents.splice(i, 1);
    })
  }

  onSelectAgent(agent) {
    this.selectedAgent = agent;
  }

  onUpdateAgent(event) {
    if (!Array.isArray(this.selectedAgent.attributes))
      this.selectedAgent.attributes = this.selectedAgent.attributes.split(',');
    this.updateReq = this.agentsService.update(this.selectedAgent).subscribe(agent => {
      console.log(agent);
    });
  }

}
