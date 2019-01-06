import { Component, OnInit, Input } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { BsModalService } from 'ngx-bootstrap';

import { AgentsService } from '../../agents.service';
import { Agent, Group } from '@agents/models';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';

@Component({
  selector: 'app-agents-group-filters-list',
  templateUrl: './agents-group-filters-list.component.html',
  styleUrls: ['./agents-group-filters-list.component.scss']
})
export class AgentsGroupFiltersListComponent implements OnInit {
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
    const modal = this.modalService.show(AgentsGroupUpsertFilterComponent);
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

}
