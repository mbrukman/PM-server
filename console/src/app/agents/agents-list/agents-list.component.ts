import { Component, OnDestroy, OnInit } from '@angular/core';

import { BsModalService } from 'ngx-bootstrap';
import { Subscription } from 'rxjs/Subscription';

import { AgentsService } from '../agents.service';
import { Agent, Group } from '@agents/models';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';

@Component({
  selector: 'app-agents-list',
  templateUrl: './agents-list.component.html',
  styleUrls: ['./agents-list.component.scss']
})
export class AgentsListComponent implements OnInit, OnDestroy {
  agentsStatus: any;
  agentsStatusReq: any;
  agents: [Agent];
  selectedAgent: Agent;
  agentsReq: any;
  updateReq: any;
  items: any[];
  selectedGroupSubscription: Subscription;
  selectedGroup: Group;

  constructor(private agentsService: AgentsService, private modalService: BsModalService) {
  }

  ngOnInit() {

    this.agentsReq = this.agentsService.list().subscribe(agents => {
      this.agents = agents;
    });

    // get agents status to pass to filters
    this.agentsStatusReq = this.agentsService.status()
      .subscribe(agents => {
        this.agentsStatus = Object.keys(agents).map(o => agents[o]);
      });

    this.selectedGroupSubscription = this.agentsService
      .getSelectedGroupAsObservable()
      .subscribe(group => this.selectedGroup = group);

    this.items = [
      { label: 'View', icon: 'fa-search', command: (event) => console.log('!') },
      { label: 'Delete', icon: 'fa-close', command: (event) => console.log('@') }
    ];
  }

  ngOnDestroy() {
    if (this.agentsReq) {
      this.agentsReq.unsubscribe();
    }
    if (this.updateReq) {
      this.updateReq.unsubscribe();
    }
    if (this.agentsStatusReq) {
      this.agentsStatusReq.unsubscribe();
    }
  }

  deleteAgent(agentId) {
    this.agentsService.delete(agentId).subscribe(() => {
      let i = this.agents.findIndex((o) => {
        return o._id === agentId
      });
      this.agents.splice(i, 1);
    })
  }

  editAgent(agentIndex) {
    let agent = this.agents[agentIndex];
    const modal = this.modalService.show(EditAgentComponent);
    modal.content.name = agent.name;
    modal.content.attributes = agent.attributes;
    modal.content.result
      .take(1)
      .filter(r => !!r)
      .subscribe(r => {
        agent.name = r.name;
        agent.attributes = r.attributes;
        this.updateAgent(agent);
      });
  }

  updateAgent(agent: Agent) {
    this.updateReq = this.agentsService.update(agent).subscribe();
  }

  onSelectAgent(agent) {
    this.selectedAgent = agent;
  }

  dragStart($event, agent) {
    this.agentsService.dragStart(agent);

  }

}
