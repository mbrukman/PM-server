import { Component, OnDestroy, OnInit } from '@angular/core';



import { BsModalService } from 'ngx-bootstrap';
import { Subscription } from 'rxjs';
import { AgentsService } from '../agents.service';
import { Agent, Group } from '@agents/models';
import { timer } from 'rxjs';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import { switchMap, take } from 'rxjs/operators';

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


  constructor(private agentsService: AgentsService,private modalService: BsModalService) {
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

    this.agentsStatusReq = timer(0, 5000).pipe(switchMap(() => this.agentsService.status())).subscribe(statuses => {
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
    const modal = this.modalService.show(AgentsGroupUpsertFilterComponent);
    modal.content.edit = false;
    modal.content.result.pipe(take(1))
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
