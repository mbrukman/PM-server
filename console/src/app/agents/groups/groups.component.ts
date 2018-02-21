import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { retry } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { AgentsService } from '@agents/agents.service';
import { Group } from '@agents/models/group.model';
import { BsModalService } from 'ngx-bootstrap';
import { InputPopupComponent } from '@agents/groups/input-popup/input-popup.component';
import { Agent } from '@agents/models/agent.model';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnDestroy {
  @Input('agents') agents: Agent[];
  groupsReq: any;
  groups: Group[];
  draggedItem: any;
  draggetItemSubscription: Subscription;
  selectedGroup: Group;

  constructor(private agentsService: AgentsService, private modalService: BsModalService) {
  }

  ngOnInit() {
    // getting groups list
    this.groupsReq = this.agentsService
      .groupsList()
      .pipe(
        retry(3)
      )
      .map(groups => {
        let g = new Group();
        groups.forEach(group => {
          let g = new Group();
          g = group;
          group = g;
        });
        return groups;
      })
      .subscribe(groups => {
        this.groups = groups;
      });

    // getting the item that is dragged from the service
    this.draggetItemSubscription = this.agentsService
      .getDragAsObservable()
      .subscribe(item => this.draggedItem = item);
  }

  ngOnDestroy() {
    if (this.groupsReq) {
      this.groupsReq.unsubscribe();
    }
    if (this.draggetItemSubscription) {
      this.draggetItemSubscription.unsubscribe();
    }
  }

  /**
   * Fired when a group tab is opened
   * @param event
   */
  onTabOpen(event?) {
    this.agentsService.selectGroup(event ? this.groups[event.index] : null);
  }

  /**
   * Called when an agent is dropped on a group.
   * @param groupIndex
   * @param groupId
   */
  drop(groupIndex, groupId) {
    if ((<string[]>this.groups[groupIndex].agents).indexOf(this.draggedItem.id) > -1) {
      return;
    }

    this.agentsService
      .addAgentToGroup(groupId, [this.draggedItem.id])
      .take(1)
      .subscribe(group => this.groups[groupIndex] = group);
  }

  /**
   * Creating a new group and adding it to groups array.
   */
  createGroup() {
    const modal = this.modalService.show(InputPopupComponent);
    modal.content.result
      .take(1)
      .filter(name => !!name) // filtering only results with a name
      .flatMap(name => this.agentsService.groupCreate({ name: name }))
      .subscribe(group => this.groups.push(group));
  }

  deleteGroup(groupIndex, groupId) {
    this.agentsService.groupDelete(groupId).subscribe(() => {
      this.groups.splice(groupIndex, 1);
    })
  }

}
