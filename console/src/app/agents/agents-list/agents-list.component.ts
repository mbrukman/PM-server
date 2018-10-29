import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { BsModalService } from 'ngx-bootstrap';

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


    this.selectedGroupSubscription = this.agentsService
      .getSelectedGroupAsObservable()
      .subscribe(group => this.selectedGroup = group);

    // get agents status to pass

    this.agentsStatusReq = Observable
      .timer(0, 5000)
      .switchMap(() => this.agentsService.status())
      .subscribe(statuses => {
        this.agentsStatus = statuses;
      });

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
        return o._id === agentId;
      });
      this.agents.splice(i, 1);
    });
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

  removeAgentFromGroup(agentId: string, groupId: string) {
    this.agentsService.removeAgentFromGroup(agentId, groupId)
      .take(1)
      .subscribe(group => {
        this.agentsService.updateGroup(group);
      });
  }
}
