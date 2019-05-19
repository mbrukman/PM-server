import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AgentsService } from '../agents.service';
import { Agent, Group } from '@agents/models';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import { take } from 'rxjs/operators';
import {PopupService} from '@shared/services/popup.service';
import { SocketService } from '@shared/socket.service';

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
  items: any[];
  selectedGroupSubscription: Subscription;
  selectedGroup: Group;
  constants : boolean = true;


  constructor(private agentsService: AgentsService,private popupService:PopupService, private socketService: SocketService) {
  }

  ngOnInit() {

    this.agentsService.list().subscribe(agents => {
      this.agents = agents;
    });

    this.agentsService.getSelectedGroupAsObservable().subscribe((group) => {
      this.selectedGroup = group
    })

    this.agentsService.getUpdateGroupAsObservable().subscribe((group) => {
      this.selectedGroup = group
    })
    

    this.selectedGroupSubscription = this.agentsService
      .getSelectedGroupAsObservable()
      .subscribe(group => {
        this.selectedGroup = group;
        this.constants = true;
      });

    // get agents status to pass


    this.agentsStatusReq = this.socketService.geteAgentsStatusAsObservable().subscribe(statuses => {
      console.log("in agent-list", statuses['5c448c2cb248189b006e4b74'].alive);
      
        this.agentsStatus = statuses;
      });

    this.items = [
      { label: 'View', icon: 'fa-search', command: (event) => console.log('!') },
      { label: 'Delete', icon: 'fa-close', command: (event) => console.log('@') }
    ];
  }

  ngOnDestroy() {
    if (this.agentsStatusReq) {
      this.agentsStatusReq.unsubscribe();
    }
  }

  
  addNewFilterParam(group:Group){
    this.popupService.openComponent(AgentsGroupUpsertFilterComponent,{edit:false})
    .pipe(take(1))
      .subscribe(filters => {
        group.filters.push(filters)
        this.agentsService.updateGroupToServer(group).subscribe((group) => {
          this.agentsService.updateGroup(group)
        })
      });
  } 


  onSelectAgent(agent) {
    this.selectedAgent = agent;
  }

  dragStart($event, agent) {
    this.agentsService.dragStart(agent);
  }

  removeAgentFromGroup(agentId: string, groupId: string) {
    this.agentsService.removeAgentFromGroup(agentId, groupId).pipe(
      take(1)
    ).subscribe(group => {
        this.agentsService.updateGroup(group);
      });
  }

  showAgents(){
    this.constants = true;
  }
  showFilters(){
    this.constants = false;
  }
}
