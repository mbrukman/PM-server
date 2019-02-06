import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { retry, take, map, filter, mergeMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { AgentsService } from '@agents/agents.service';
import { Group } from '@agents/models/group.model';
import { BsModalService } from 'ngx-bootstrap';
import { InputPopupComponent } from '@agents/groups/input-popup/input-popup.component';
import { Agent } from '@agents/models/agent.model';
import {AgentsGroupUpsertComponent} from '@agents/agents-group-upsert/agents-group-upsertcomponent'
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-agents-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnDestroy {
  @Input('agents') agents: Agent[];
  groupsReq: any;
  updatedGroupSubscription: Subscription;
  groups: Group[];
  draggedItem: any;
  draggetItemSubscription: Subscription;
  selectedGroup: Group;
  updateReq: any;
  selectedDropGroupIndex : string;
  currentGroupIndex : number;

  constructor(private agentsService: AgentsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    // getting groups list
    this.groupsReq = this.agentsService
      .groupsList()
      .pipe(
        retry(3),
        map(groups => {
          let g = new Group();
          groups.forEach(group => {
            let gr = new Group();
            gr = group;
            group = gr;
          });
          return groups;
        })
      ).subscribe(groups => {
        this.groups = groups;
      });

    // getting the item that is dragged from the service
    this.draggetItemSubscription = this.agentsService
      .getDragAsObservable()
      .subscribe(item => this.draggedItem = item);

    this.agentsService.getSelectedGroupAsObservable().subscribe(group => {
      this.selectedGroup = group
    })  
    
    this.updatedGroupSubscription = this.agentsService.getUpdateGroupAsObservable().subscribe(group => {
      this.groups[this.groups.findIndex(o => o._id === group._id)] = group;
    });
  }

  allAgents(){
    this.currentGroupIndex = null;
    this.agentsService.selectGroup(null);
  }

  ngOnDestroy() {
    if (this.groupsReq) {
      this.groupsReq.unsubscribe();
    }

    if (this.draggetItemSubscription) {
      this.draggetItemSubscription.unsubscribe();
    }

    if (this.updatedGroupSubscription) {
      this.updatedGroupSubscription.unsubscribe();
    }
  }

  /**
   * Fired when a group tab is opened
   * @param event
   */
  selectGroup(group : Group, groupIndex : number) {
    this.currentGroupIndex = groupIndex;
    this.agentsService.selectGroup(group);
  }

  /**
   * Called when an agent is dropped on a group.
   * @param groupIndex
   * @param groupId
   */

   onDragLeave(){
    this.selectedDropGroupIndex = null
   }

   allowDrop(i){
    this.selectedDropGroupIndex = i
   }

  drop(groupIndex, groupId) {
    this.selectedDropGroupIndex = null
    if ((<string[]>this.groups[groupIndex].agents).indexOf(this.draggedItem.id) > -1) {
      return;
    }
    this.agentsService
      .addAgentToGroup(groupId, [this.draggedItem.id]).pipe(
        take(1)
      ).subscribe(group => this.groups[groupIndex] = group);
  }

  /**
   * Creating a new group and adding it to groups array.
   */
  createGroup() {
    const modal = this.modalService.show(InputPopupComponent);
    modal.content.result.pipe(
      take(1),
      filter(name => !!name),
      mergeMap(name => this.agentsService.groupCreate(<Group>{ name: name }))
    ).subscribe(group => this.groups.push(group));
  }

  editGroup(index){
    let group = this.groups[index];
    const modal = this.modalService.show(AgentsGroupUpsertComponent);
    modal.content.name = group.name;
    modal.content.result.pipe(
      take(1),
      filter(r => !!r)
    ).subscribe(r => {
        group.name = r.name;
        this.updateGroup(group);
      });
  }

  updateGroup(group:Group){
    this.updateReq = this.agentsService.updateGroupToServer(group).subscribe((group) => {
      this.agentsService.updateGroup(group)
    });
  }

  deleteGroup(groupIndex, groupId) {
    this.agentsService.groupDelete(groupId).subscribe(() => {
      this.groups.splice(groupIndex, 1);
    });
  }

}
