import { Component, OnDestroy, OnInit, Input } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { BsModalService } from 'ngx-bootstrap';

import { AgentsService } from '../../agents.service';
import { Agent, Group } from '@agents/models';
import {GroupDynamicConditionFilterPopupComponent} from '@agents/groups/group-dynamic-condition-filter-popup/group-dynamic-condition-filter-popup.component'

@Component({
  selector: 'app-filter-group-list',
  templateUrl: './filter-group-list.component.html',
  styleUrls: ['./filter-group-list.component.scss']
})
export class FilterGroupListComponent implements OnInit,OnDestroy {
    agentsStatusReq: any;
    selectedAgent: Agent;
    agentsReq: any;
    updateReq: any;
    items: any[];
    selectedGroupSubscription: Subscription;
    @Input('group') group: Group;

  constructor(private agentsService: AgentsService, private modalService: BsModalService) {
  }
  ngOnInit(){
    this.agentsService.getUpdateGroupAsObservable().subscribe((group) => {
      this.group = group
    })
  }

  editFilter(filter,index){
    const modal = this.modalService.show(GroupDynamicConditionFilterPopupComponent);
    modal.content.edit = true;
    modal.content.field = filter.field;
    modal.content.type = filter.filterType;
    modal.content.value = filter.value;
    modal.content.result
      .take(1)
      .subscribe(filters => {
        this.group.filters.splice(index,1,filters)
        this.agentsService.updateGroupToServer(this.group).subscribe((group) => {
          this.agentsService.updateGroup(group)
        })
      });
  }

  deleteFilter(index){
    this.agentsService.deleteFilterFromGroup(this.group.id,index)
    .subscribe(group => {
      this.agentsService.updateGroup(group);
    });
  }

  ngOnDestroy(){

  }
}
