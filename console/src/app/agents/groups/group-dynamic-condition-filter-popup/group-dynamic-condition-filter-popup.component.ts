import { Component, Input, OnInit } from '@angular/core';


import { FILTER_FIELDS, FILTER_TYPES, Group,FilterParam } from '@agents/models/group.model';

import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs/Subject';


@Component({
  selector: 'app-group-dynamic-condition-filter-popup',
  templateUrl: './group-dynamic-condition-filter-popup.component.html',
  styleUrls: ['./group-dynamic-condition-filter-popup.component.scss']
})
export class GroupDynamicConditionFilterPopupComponent implements OnInit {
    
  filterTypes = Object.keys(FILTER_TYPES);
  fields = Object.keys(FILTER_FIELDS);
  value:string;
  field:FILTER_FIELDS;
  type: FILTER_TYPES;
  edit: boolean;
  public result: Subject<FilterParam> = new Subject<FilterParam>();


  constructor(public bsModalRef: BsModalRef) {
    }

  ngOnInit(){

  }

  onClose() {
    this.bsModalRef.hide();
  }

  onConfirm() {

    let filters =  new FilterParam(this.field,this.value,this.type)
    this.result.next(filters);
    this.onClose();
  }
}