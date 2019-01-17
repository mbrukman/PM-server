import { Component, OnInit, Input } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import { BsModalService } from 'ngx-bootstrap';
import * as _ from 'lodash';
import { AgentsService } from '../../agents.service';
import { Agent, Group } from '@agents/models';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import {FILTER_FIELDS,FILTER_TYPES} from '@agents/models/group.model'
import {AgentsGroupFilter} from '@agents/models/group.model'

@Component({
  selector: 'app-agents-group-filters-list',
  templateUrl: './agents-group-filters-list.component.html',
  styleUrls: ['./agents-group-filters-list.component.scss']
})
export class AgentsGroupFiltersListComponent implements OnInit {
    fields = FILTER_FIELDS;
    types = FILTER_TYPES
    agentsStatusReq: any;
    selectedAgent: Agent;
    agentsReq: any;
    updateReq: any;
    items: any[];
    selectedGroupSubscription: Subscription;
    // filtersGroups: AgentsGroupFilter[];
    @Input('group') group: Group;

  constructor(private agentsService: AgentsService, private modalService: BsModalService) {
  }
  ngOnInit(){
    this.agentsService.getUpdateGroupAsObservable().subscribe((group) => {
      this.group = group
      // this.filtersGroups = _.cloneDeep(group.filters)
      // this.filtersGroups.forEach((filter) => {
      //   filter.field = this.fields[this.fields.findIndex(field => field.id == filter.field)].label
      //   filter.filterType = this.types[this.types.findIndex(type => type.id == filter.filterType)].label
      // })
    })
  }

  getLabelById(type, id){
    return this[type][this[type].findIndex(type => type.id == id)].label
  }

  editFilter(filter,index){
    const modal = this.modalService.show(AgentsGroupUpsertFilterComponent);
    modal.content.edit = true;
    modal.content.filter = filter;
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
