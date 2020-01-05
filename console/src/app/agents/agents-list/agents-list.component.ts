import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {AgentsService} from '@app/services/agent/agents.service';
import {AgentsGroupFilter, Group} from '@agents/models';
import {timer} from 'rxjs';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import {switchMap, take, tap} from 'rxjs/operators';
import {PopupService} from '@shared/services/popup.service';
import {Agent} from '@app/services/agent/agent.model';

@Component({
  selector: 'app-agents-list',
  templateUrl: './agents-list.component.html',
  styleUrls: ['./agents-list.component.scss']
})
export class AgentsListComponent implements OnInit, OnDestroy {
  items: any[];
  agents: [Agent];
  agentsStatus: any;
  selectedGroup: Group;
  constants: boolean = true;

  private mainSubscription = new Subscription();


  constructor(private agentsService: AgentsService, private popupService: PopupService) {
  }

  ngOnInit() {
    const agentListSubscription = this.agentsService.list().subscribe(agents => {
      this.agents = agents;
    });

    const agentSelectedGroupSubscription = this.agentsService.getSelectedGroupAsObservable().subscribe((group) => {
      this.selectedGroup = group;
    });

    const agentUpdateGroupSubscription = this.agentsService.getUpdateGroupAsObservable().subscribe((group) => {
      this.selectedGroup = group;
    });


    const selectedGroupSubscription = this.agentsService
      .getSelectedGroupAsObservable()
      .subscribe(group => {
        this.selectedGroup = group;
        this.constants = true;
      });

    // get agents status to pass

    const agentStatusSubscription = timer(0, 5000)
      .pipe(
        switchMap(() => this.agentsService.status())
      ).subscribe(statuses => {
        this.agentsStatus = statuses;
      });

    this.items = [
      {label: 'View', icon: 'fa-search', command: (event) => console.log('!')},
      {label: 'Delete', icon: 'fa-close', command: (event) => console.log('@')}
    ];

    this.mainSubscription.add(agentListSubscription);
    this.mainSubscription.add(agentSelectedGroupSubscription);
    this.mainSubscription.add(agentUpdateGroupSubscription);
    this.mainSubscription.add(selectedGroupSubscription);
    this.mainSubscription.add(agentStatusSubscription);
  }

  ngOnDestroy() {
    this.mainSubscription.unsubscribe();
  }

  addNewFilterParam(group: Group) {
    this.popupService.openComponent(AgentsGroupUpsertFilterComponent, {edit: false})
      .pipe(
        take(1),
        tap((filters: AgentsGroupFilter) => group.filters.push(filters)),
        switchMap(() => this.agentsService.updateGroupToServer(group))
      ).subscribe((updatedGroup) => this.agentsService.updateGroup(updatedGroup));
  }

  showAgents() {
    this.constants = true;
  }

  showFilters() {
    this.constants = false;
  }
}
