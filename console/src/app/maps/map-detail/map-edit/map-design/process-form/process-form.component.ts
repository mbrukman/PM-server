import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import * as _ from 'lodash';

import { Process } from '../../../../models/map-structure.model';
import { Plugin } from '../../../../../plugins/models/plugin.model';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { PluginMethod } from '../../../../../plugins/models/plugin-method.model';

@Component({
  selector: 'app-process-form',
  templateUrl: './process-form.component.html',
  styleUrls: ['./process-form.component.scss']
})
export class ProcessFormComponent implements OnInit {
  @Input('process') process: Process;
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  processForm: FormGroup;
  action: boolean = false;
  index: number;
  plugin: Plugin;
  selectedMethod: PluginMethod;

  constructor() {
  }

  ngOnInit() {
    if (!this.process) {
      this.closePane();
      return;
    }

    this.processForm = new FormGroup({
      name: new FormControl(this.process.name),
      uuid: new FormControl(this.process.uuid),
      description: new FormControl(this.process.description),
      mandatory: new FormControl(this.process.mandatory),
      condition: new FormControl(this.process.condition),
      preRun: new FormControl(this.process.preRun),
      postRun: new FormControl(this.process.postRun),
      correlateAgents: new FormControl(this.process.correlateAgents),
      filterAgents: new FormControl(this.process.filterAgents),
      actions: new FormArray([])
    });

    if (this.process.actions) {
      this.process.actions.forEach((action, actionIndex) => {
        let actionControl = <FormArray>this.processForm.controls['actions'];
        actionControl.push(this.initActionController(action.id, action.name, action.timeout, action.timeunit, action.retries, action.mandatory, action.method));
        if (action.params && action.params.length > 0) {
          action.params.forEach((param, index) => {
            actionControl.controls[actionIndex]['controls'].params.push(this.initActionParamController(param.code, param.value, param._id ? param._id : param.param, param.viewName, param.name));
          })
        } else {
          console.log("no params!");
        }
      });
    }
    this.plugin = _.cloneDeep(this.process.plugin);
  }

  /* add a new action to the process*/
  addNewAction() {
    let actionControl = <FormArray>this.processForm.controls['actions'];
    actionControl.push(this.initActionController());
    this.editAction(actionControl.length - 1); // switch to edit the new action
  }

  backToProcessView() {
    this.action = false;
    this.index = null;
    this.selectedMethod = null;
  }

  /* adding a new action to the form */
  removeAction(index: number) {
    let actionControl = <FormArray>this.processForm.controls['actions'];
    actionControl.removeAt(index);
  }

  editAction(index: number) {
    this.index = index;
    this.action = true;
  }

  initActionController(id?, name?, timeout?, timeunit?, retries?, mandatory?, method?): FormGroup {
    return new FormGroup({
      id: new FormControl(id),
      name: new FormControl(name),
      timeout: new FormControl(timeout),
      timeunit: new FormControl(timeunit),
      retries: new FormControl(retries),
      mandatory: new FormControl(mandatory),
      method: new FormControl(method),
      params: new FormArray([])
    })
  }

  initActionParamController(code?, value?, id?, viewName?, name?) {
    return new FormGroup({
      code: new FormControl(code),
      value: new FormControl(value),
      param: new FormControl(id),
      viewName: new FormControl(viewName),
      name: new FormControl(name)
    });
  }

  onSelectMethod() {
    /* when a method selected - change the form params*/
    let methodId = this.processForm.value.actions[this.index].method;
    let action = this.processForm.controls['actions']['controls'][this.index];
    action.controls.params = new FormArray([]);

    const method = this.plugin.methods.find((o) => {
      return o._id === methodId
    });
    method.params.forEach(param => {
      action.controls.params.push(this.initActionParamController(null, null, param._id, param.viewName, param.name))
    });
  }

  closePane() {
    this.close.emit();
  }

  deleteProcess() {
    this.delete.emit();
  }

  saveProcess(form) {
    this.processForm.controls['actions']['controls'].forEach(control => {
      // have to update the form because of change detection bug.
      control['controls']['name'].setValue(this.processForm.controls['actions']['controls'][0]['controls']['name'].value)
    });
    if (this.action) {
      this.backToProcessView();
    }
    this.saved.emit(this.processForm.value);
  }

}
