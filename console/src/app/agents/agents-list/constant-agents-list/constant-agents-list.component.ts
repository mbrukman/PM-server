import { Component, OnDestroy, OnInit, Input } from '@angular/core';

import { Subscription } from 'rxjs';
import {PopupService} from '@shared/services/popup.service'
import { AgentsService } from '../../agents.service';
import { Agent, Group } from '@agents/models';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-constant-agents-list',
  templateUrl: './constant-agents-list.component.html',
  styleUrls: ['./constant-agents-list.component.scss']
})
export class ConstantAgentsListComponent implements OnInit,OnDestroy {
    selectedAgent: Agent;
    selectedGroupSubscription: Subscription;
    @Input('agentsStatus') agentsStatus: any;
    @Input('agents') agents: [Agent];
    @Input('group') group: Group;

  constructor(private agentsService: AgentsService,private popupService:PopupService ) {
  }

  ngOnInit() {
    this.agentsService.getUpdateGroupAsObservable().subscribe((group) => {
      this.group = group
    })
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
    let content = {
      name:agent.name,
      attributes:agent.attributes
    }
    this.popupService.openComponent(EditAgentComponent,content)
    .pipe(
      take(1),
      filter(r => !!r)
    ).subscribe(r => {
        agent.name = r.name;
        agent.attributes = r.attributes;
        this.updateAgent(agent);
      });
  }

  updateAgent(agent: Agent) {
    this.agentsService.update(agent).subscribe();
  }

  onSelectAgent(agent) {
    this.selectedAgent = agent;
  }
  removeAgentFromGroup(agentId: string, groupId: string) {
    this.agentsService.removeAgentFromGroup(agentId, groupId)
      .subscribe(group => {
        this.agentsService.updateGroupToServer(group).subscribe((group) => {
          this.agentsService.updateGroup(group)
        })
      });
  }

  dragStart($event, agent) {
    this.agentsService.dragStart(agent);
  }

  ngOnDestroy(){
      
  }
} 