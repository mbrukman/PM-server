import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { FILTER_FIELDS, FILTER_TYPES, Group } from '@agents/models/group.model';
import { AgentsService } from '@agents/agents.service';
import { retry } from 'rxjs/operators';

@Component({
  selector: 'app-group-dynamic-condition-filter',
  templateUrl: './group-dynamic-condition-filter.component.html',
  styleUrls: ['./group-dynamic-condition-filter.component.scss']
})
export class GroupDynamicConditionFilterComponent implements OnInit {
  filterForm: FormGroup;
  filterTypes = Object.keys(FILTER_TYPES);
  fields = Object.keys(FILTER_FIELDS);
  @Input('group') group: Group;

  constructor(private agentsService: AgentsService) {
  }

  ngOnInit() {
    this.filterForm = new FormGroup({
      params: new FormArray([])
    });

    if (this.group.filters) {
      this.group.filters.forEach(filter => {
        this.addNewFilterParam(filter.field, filter.value, filter.filterType);
      });
    }

    this.filterForm.valueChanges
      .debounceTime(1000)
      .distinctUntilChanged()
      .filter(val => this.filterForm.valid)
      .flatMap(val => this.agentsService.addGroupFilters(this.group.id, val.params))
      .pipe(
        retry(3)
      )
      .subscribe(group => {
        this.group = group;
        this.agentsService.reEvaluateGroupFilters(group);
      });
  }

  addNewFilterParam(field?, value?, filterType?) {
    const param = new FormGroup({
      field: new FormControl(field, Validators.required),
      value: new FormControl(value, Validators.required),
      filterType: new FormControl(filterType, Validators.required)
    });

    const paramsControl = <FormArray>this.filterForm.controls['params'];
    paramsControl.push(param);
  }

  removeFilter(index: number) {
    const paramsControl = <FormArray>this.filterForm.controls['params'];
    paramsControl.removeAt(index);
  }

}
