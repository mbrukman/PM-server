import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import * as _ from 'lodash';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';

import { distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Process, Action, ActionParam, ProcessViewWrapper } from '@maps/models';
import { Plugin } from '@plugins/models/plugin.model';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { SocketService } from '@shared/socket.service';
import { PluginsService } from '@plugins/plugins.service';
import { MapDesignService } from '@maps/map-detail/map-edit/map-design.service';
import { BsModalService } from 'ngx-bootstrap';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import {PluginDeletedComponent} from '@maps/map-detail/map-edit/map-design/plugindeleted-popup/plugindeleted-popup.component'
import {FLOW_CONTROL_TYPES, COORDINATION_TYPES}  from '@maps/contants'

@Component({
  selector: 'app-process-form',
  templateUrl: './process-form.component.html',
  styleUrls: ['./process-form.component.scss']
})
export class ProcessFormComponent implements OnInit, OnDestroy {
  @Input('processViewWrapper') processViewWrapper: ProcessViewWrapper;
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();
  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  formValueChangeSubscription: Subscription;
  processUpdateSubscription: Subscription;
  processForm: FormGroup;
  action: boolean = false;
  index: number;
  plugin: Plugin;
  methods: object = {};
  bsModalRef: BsModalRef;
  selectedMethod: PluginMethod;
  FLOW_CONTROL_TYPES 
  COORDINATION_TYPES


  constructor(
    private socketService: SocketService,
    private pluginsService: PluginsService,
    private mapDesignService: MapDesignService,
    private modalService: BsModalService
    
  ) {
    this.COORDINATION_TYPES = COORDINATION_TYPES;
    this.FLOW_CONTROL_TYPES = FLOW_CONTROL_TYPES;
   }

  ngOnInit() {
    if (!this.processViewWrapper.process) {
      this.closePane();
      return;
    }
    this.processForm = Process.getFormGroup(this.processViewWrapper.process);

    this.processUpdateSubscription = this.mapDesignService
      .getUpdateProcessAsObservable()
      .filter(process => process.uuid === this.processViewWrapper.process.uuid)
      .subscribe(process => {
        this.processForm.get('coordination').setValue(process.coordination);
      });

    // this.process = new Process(this.process);

    if (this.processViewWrapper.process.actions) {
      this.processViewWrapper.process.actions.forEach((action, actionIndex) => {
        const actionControl = <FormArray>this.processForm.controls['actions'];
        actionControl.push(this.initActionController(action));
        if (action.params && action.params.length > 0) {
          action.params.forEach(param => {
            actionControl.controls[actionIndex]['controls'].params.push(ActionParam.getFormGroup(param));
          });
        }
      });
    }

    this.plugin = _.cloneDeep(this.processViewWrapper.process.plugin);
    this.generateAutocompleteParams();

    // subscribe to changes in form
    this.formValueChangeSubscription = this.processForm.valueChanges
      .debounceTime(300)
      .pipe(distinctUntilChanged())
      .filter(formvalue => this.processForm.valid)
      .subscribe(formValue => {
        this.saved.emit(this.processForm.value);
      });
  }

  ngOnDestroy(): void {
    if (this.processUpdateSubscription) {
      this.processUpdateSubscription.unsubscribe();
    }
    if (this.formValueChangeSubscription) {
      this.formValueChangeSubscription.unsubscribe();
    }
  }

  /**
   * if the plugin has autocomplete method it generates them
   */
  generateAutocompleteParams() {
    if (!this.plugin) return;
    Observable.from(this.plugin.methods)
      .filter(method => this.methodHaveParamType(method, 'autocomplete')) // check if has autocomplete
      .flatMap(method => {
        return Observable.forkJoin(
          Observable.of(method), // the method
          this.pluginsService.generatePluginParams(this.plugin._id, method.name) // generated params
        );
      })
      .map(data => {
        // data: [method, [generated params]]
        data[1].forEach(param => {
          data[0].params[
            data[0].params.findIndex(o => o.name === param.name)
          ] = param;
        });
        return data[0];
      })
      .subscribe(method => {
        this.plugin.methods[
          this.plugin.methods.findIndex(o => o.name === method.name)
        ] = method;
        this.addToMethodContext(method);
      });

    Observable.from(this.plugin.methods)
      .filter(method => this.methodHaveParamType(method, 'options'))
      .subscribe(method => {
        this.addToMethodContext(method);
      });
  }

  addToMethodContext(method) {
    this.methods[method.name] = method;
  }

  methodHaveParamType(method: PluginMethod, type: string): boolean {
    return method.params.findIndex(p => p.type === type) > -1;
  }

  /**
   * Add a new action to process
   */
  addNewAction() {
    if(this.processViewWrapper.plugin){
      const actionControl = <FormArray>this.processForm.controls['actions'];
      actionControl.push(this.initActionController());
      this.editAction(actionControl.length - 1); // switch to edit the new action
    }
    else {
      this.bsModalRef = this.modalService.show(PluginDeletedComponent);
      this.bsModalRef.content.pluginName = this.processViewWrapper.process.used_plugin.name
    }
    
  }

  backToProcessView() {
    this.action = false;
    this.index = null;
    this.selectedMethod = null;
  }

  /**
   * Removing an action at index
   * @param {number} index
   */
  removeAction(index: number) {
    (<FormArray>this.processForm.controls['actions']).removeAt(index);
  }

  /**
   * Setting editing as action
   * @param {number} index
   */
  editAction(index: number) {
    if(this.processViewWrapper.plugin){
      this.index = index;
      this.action = true;
    }
    else{
      this.bsModalRef = this.modalService.show(PluginDeletedComponent);
      this.bsModalRef.content.pluginName = this.processViewWrapper.process.used_plugin.name
    }
  }

  /**
   * Returning a FormGroup with process action fields
   * @param action
   * @returns {FormGroup}
   */
  initActionController(action?: Action): FormGroup {
    return Action.getFormGroup(action);
  }

  /**
   * Called from the template once user changes a method
   */
  onSelectMethod() {
    this.selectedMethod = this.processForm.value.actions[this.index].method;
    const methodName = this.processForm.value.actions[this.index].method;
    const action = this.processForm.controls['actions']['controls'][this.index];
    const method = this.plugin.methods.find(o => o.name === methodName);
    this.clearFormArray(action.controls.params);
    if (!method) {
      this.socketService.setNotification({
        title: 'OH OH',
        message: 'Unexpected error, please try again.'
      });
      return;
    }
    method.params.forEach(param => {
      action.controls.params.push(PluginMethodParam.getFormGroup(param));
    });
  }

  /**
   * Emitting close event
   */
  closePane() {
    this.close.emit();
  }

  /**
   * Emitting delete event
   */
  deleteProcess() {
    this.delete.emit();
  }

  /**
   * Emitting form change when mouse up event happened over action
   * @param event
   */
  onMouseUp(event) {
    setTimeout(() => {
      this.processForm.controls.actions.updateValueAndValidity();
    }, 0);
  }

  private clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }
}
