import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {retry, take, filter, mergeMap} from 'rxjs/operators';
import {Subscription} from 'rxjs';

import {AgentsService} from '@app/services/agent/agents.service';
import {Group} from '@agents/models/group.model';
import {PopupService} from '@shared/services/popup.service';
import {InputPopupComponent} from '@agents/groups/input-popup/input-popup.component';
import {Agent} from '@app/services/agent/agent.model';
import {AgentsGroupUpsertComponent} from '@agents/agents-group-upsert/agents-group-upsertcomponent';

@Component({
  selector: 'app-agents-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnDestroy {
  @Input('agents') agents: Agent[];
  groups: Group[];
  draggedItem: any;
  selectedGroup: Group;
  selectedDropGroupIndex: string;
  currentGroupIndex: number;

  private mainSubscription = new Subscription();

  constructor(
    private agentsService: AgentsService,
    private popupService: PopupService
  ) {
  }

  ngOnInit() {
    // getting groups list
    const agentGroupSubscription = this.agentsService.groupsList().pipe(
      retry(3)
    ).subscribe(groups => this.groups = groups);

    // getting the item that is dragged from the service
    const draggedItemSubscription = this.agentsService
      .getDragAsObservable()
      .subscribe(item => this.draggedItem = item);

    const selectedGroupSubscription = this.agentsService.getSelectedGroupAsObservable().subscribe(group => {
      this.selectedGroup = group;
    });

    const updateGroupSubscription = this.agentsService.getUpdateGroupAsObservable().subscribe(group => {
      this.groups[this.groups.findIndex(o => o._id === group._id)] = group;
    });

    this.mainSubscription.add(agentGroupSubscription);
    this.mainSubscription.add(draggedItemSubscription);
    this.mainSubscription.add(selectedGroupSubscription);
    this.mainSubscription.add(updateGroupSubscription);
  }

  allAgents() {
    this.currentGroupIndex = null;
    this.agentsService.selectGroup(null);
  }

  ngOnDestroy() {
    this.mainSubscription.unsubscribe();
  }

  /**
   * Fired when a group tab is opened
   * @param group
   * @param groupIndex
   */
  selectGroup(group: Group, groupIndex: number) {
    this.currentGroupIndex = groupIndex;
    this.agentsService.selectGroup(group);
  }

  /**
   * Called when an agent is dropped on a group.
   */

  onDragLeave() {
    this.selectedDropGroupIndex = null;
  }

  allowDrop(i) {
    this.selectedDropGroupIndex = i;
  }

  drop(groupIndex, groupId) {
    this.selectedDropGroupIndex = null;
    if ((<string[]>this.groups[groupIndex].agents).indexOf(this.draggedItem.id) > -1) {
      return;
    }
    const agentAddedSubscription = this.agentsService
      .addAgentToGroup(groupId, [this.draggedItem.id]).pipe(
        take(1)
      ).subscribe(group => this.groups[groupIndex] = group);

    this.mainSubscription.add(agentAddedSubscription);
  }

  /**
   * Creating a new group and adding it to groups array.
   */
  createGroup() {
    const popupSubscription = this.popupService.openComponent(
      InputPopupComponent,
      {}
    ).pipe(
      take(1),
      filter(name => !!name),
      mergeMap(name => this.agentsService.groupCreate(<Group>{name: name}))
    ).subscribe(group => this.groups.push(group));
    this.mainSubscription.add(popupSubscription);
  }

  editGroup(index) {
    let group = this.groups[index];
    const editGroupSubscription = this.popupService.openComponent
    (AgentsGroupUpsertComponent,
      {name: group.name}
    )
      .pipe(
        take(1),
        filter(r => !!r)
      ).subscribe(r => {
        group.name = r.name;
        this.updateGroup(group);
      });

    this.mainSubscription.add(editGroupSubscription);
  }

  updateGroup(group: Group) {
    const updateGroupSubscription = this.agentsService.updateGroupToServer(group)
      .subscribe((updatedGroup) => this.agentsService.updateGroup(updatedGroup));
    this.mainSubscription.add(updateGroupSubscription);
  }

  deleteGroup(groupIndex, groupId) {
    const deleteGroupSubscription = this.agentsService.groupDelete(groupId).subscribe(() => {
      this.groups.splice(groupIndex, 1);
    });
    this.mainSubscription.add(deleteGroupSubscription);
  }
}
