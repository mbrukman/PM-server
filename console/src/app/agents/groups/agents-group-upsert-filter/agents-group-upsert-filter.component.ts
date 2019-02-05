import { Component, Input, OnInit } from '@angular/core';


import { FILTER_FIELDS, FILTER_TYPES, AgentsGroupFilter } from '@agents/models/group.model';

import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-agents-group-upsert-filter',
  templateUrl: './agents-group-upsert-filter.component.html',
  styleUrls: ['./agents-group-upsert-filter.component.scss']
})
export class AgentsGroupUpsertFilterComponent implements OnInit {
  filterTypes = FILTER_TYPES;
  fields = FILTER_FIELDS;
  filter : AgentsGroupFilter;
  edit: boolean;

  public result: Subject<AgentsGroupFilter> = new Subject<AgentsGroupFilter>();


  constructor(public bsModalRef: BsModalRef) {
    }

  ngOnInit(){
    if (!this.filter) this.filter  = new AgentsGroupFilter();
  }

  onClose() {
    this.bsModalRef.hide();
  }

  onConfirm() {
    this.result.next(this.filter);
    this.onClose();
  }
}