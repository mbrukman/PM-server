import {Component, OnDestroy, OnInit, Input} from '@angular/core';
import {Subscription} from 'rxjs';
import {PopupService} from '@shared/services/popup.service';
import {AgentsService} from '@app/services/agent/agents.service';
import {Agent, Group} from '@agents/models';
import {EditAgentComponent} from '@agents/edit-agent/edit-agent.component';
import {filter, map, switchMap, take} from 'rxjs/operators';

@Component({
  selector: 'app-constant-agents-list',
  templateUrl: './constant-agents-list.component.html',
  styleUrls: ['./constant-agents-list.component.scss']
})
export class ConstantAgentsListComponent implements OnInit, OnDestroy {
  private mainSubscription = new Subscription();

  @Input('agentsStatus') agentsStatus: any;
  @Input('agents') agents: [Agent];
  @Input('group') group: Group;

  constructor(
    private agentsService: AgentsService,
    private popupService: PopupService
  ) {}

  ngOnInit() {
    const updateGroupSubscription = this.agentsService.getUpdateGroupAsObservable()
      .subscribe((group) => this.group = group);
    this.mainSubscription.add(updateGroupSubscription);
  }

  deleteAgent(agentId) {
    const agentSubscription = this.agentsService.delete(agentId)
      .subscribe(() => {
        let i = this.agents
          .findIndex((agent) => agent._id === agentId);
        this.agents.splice(i, 1);
      });
    this.mainSubscription.add(agentSubscription);
  }

  editAgent(agentIndex) {
    let agent: Agent = this.agents[agentIndex];
    let content = {
      name: agent.name,
      attributes: agent.attributes
    };
    this.popupService.openComponent(EditAgentComponent, content)
      .pipe(
        take(1),
        filter(r => !!r),
        map((result: any) => {
          agent.name = result.name;
          agent.attributes = result.attributes;
          return agent;
        }),
        switchMap((modifiedAgent) => this.agentsService.update(modifiedAgent))
      ).subscribe();
  }

  removeAgentFromGroup(agentId: string, groupId: string) {
    const removeAgentSubscription = this.agentsService
      .removeAgentFromGroup(agentId, groupId)
      .pipe(
        switchMap(group => this.agentsService.updateGroupToServer(group)),
      ).subscribe(group => this.agentsService.updateGroup(group));

    this.mainSubscription.add(removeAgentSubscription);
  }

  dragStart($event, agent) {
    this.agentsService.dragStart(agent);
  }

  ngOnDestroy() {
    this.mainSubscription.unsubscribe();
  }
}
