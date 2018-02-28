import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

import * as _ from 'lodash';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';

import { distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Process } from '@maps/models/map-structure.model';
import { Plugin } from '@plugins/models/plugin.model';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { SocketService } from '@shared/socket.service';
import { PluginsService } from '@plugins/plugins.service';
import { MapDesignService } from '@maps/map-detail/map-edit/map-design.service';


@Component({
  selector: 'app-process-form',
  templateUrl: './process-form.component.html',
  styleUrls: ['./process-form.component.scss']
})
export class ProcessFormComponent implements OnInit, OnDestroy {

  @Input('process') process: Process;
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
  selectedMethod: PluginMethod;

  COORDINATION_TYPES = {
    'wait': 'Wait for all',
    'race': 'Run once for first',
    'each': 'Run for each in link'
  };


  FLOW_CONTROL_TYPES = {
    'wait': 'Wait for all agents and then run',
    'race': 'Run only for first agent',
    'each': 'Run for each agent'
  };


  constructor(private socketService: SocketService,
              private pluginsService: PluginsService,
              private mapDesignService: MapDesignService) { }

  ngOnInit() {
    if (!this.process) {
      this.closePane();
      return;
    }

    this.processUpdateSubscription = this.mapDesignService.getUpdateProcessAsObservable()
      .filter(process => process.uuid === this.process.uuid)
      .subscribe(process => {
        this.process = process;
        this.processForm.get('coordination').setValue(process.coordination);
      });

    this.processForm = this.initProcessForm(
      this.process.name,
      this.process.uuid,
      this.process.description,
      this.process.mandatory,
      this.process.condition,
      this.process.coordination,
      this.process.flowControl,
      this.process.preRun,
      this.process.postRun,
      this.process.correlateAgents,
      this.process.filterAgents
    );

    if (this.process.actions) {
      this.process.actions.forEach((action, actionIndex) => {
        const actionControl = <FormArray>this.processForm.controls['actions'];
        actionControl.push(this.initActionController(
          action.id,
          action.name,
          action.timeout,
          action.timeunit,
          action.retries,
          action.mandatory,
          action.method
        ));
        if (action.params && action.params.length > 0) {
          action.params.forEach((param) => {
            actionControl.controls[actionIndex]['controls'].params.push(this.initActionParamController(
              param.code,
              param.value,
              param._id ? param._id : param.param,
              param.viewName,
              param.name,
              param.type
            ));
          });
        }
      });
    }

    this.plugin = _.cloneDeep(this.process.plugin);
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
    Observable.from(this.plugin.methods)
      .filter(method => this.hasAutocompleteParam(method)) // check if has autocomplete
      .flatMap(method => {
        return Observable.forkJoin(
          Observable.of(method), // the method
          this.pluginsService.generatePluginParams(this.plugin._id, method.name) // generated params
        );
      }).map(data => { // data: [method, [generated params]]
        data[1].forEach(param => {
          data[0].params[data[0].params.findIndex(o => o.name === param.name)] = param;
        });
        return data[0];
      })
      .subscribe(method => {
        this.plugin.methods[this.plugin.methods.findIndex(o => o.name === method.name)] = method;
        this.addToMethodContext(method);
      });
  }

  addToMethodContext(method) {
    this.methods[method.name] = method;
  }


  hasAutocompleteParam(method): boolean {
    return method.params.findIndex(p => p.type === 'autocomplete') > -1
  }

  /**
   * Initiating the process form with values, returning a form group object
   * @param name
   * @param uuid
   * @param description
   * @param mandatory
   * @param condition
   * @param coordination
   * @param flowControl
   * @param preRun
   * @param postRun
   * @param correlateAgents
   * @param filterAgents
   * @returns {FormGroup}
   */
  initProcessForm(name, uuid, description, mandatory, condition, coordination, flowControl, preRun, postRun, correlateAgents, filterAgents) {
    return new FormGroup({
      name: new FormControl(name),
      uuid: new FormControl(uuid),
      description: new FormControl(description),
      mandatory: new FormControl(mandatory),
      condition: new FormControl(condition),
      coordination: new FormControl(coordination),
      flowControl: new FormControl(flowControl),
      preRun: new FormControl(preRun),
      postRun: new FormControl(postRun),
      correlateAgents: new FormControl(correlateAgents),
      filterAgents: new FormControl(filterAgents),
      actions: new FormArray([])
    })
  }

  /**
   * Add a new action to process
   */
  addNewAction() {
    const actionControl = <FormArray>this.processForm.controls['actions'];
    actionControl.push(this.initActionController());
    this.editAction(actionControl.length - 1); // switch to edit the new action
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
    const actionControl = <FormArray>this.processForm.controls['actions'];
    actionControl.removeAt(index);
  }

  /**
   * Setting editing as action
   * @param {number} index
   */
  editAction(index: number) {
    this.index = index;
    this.action = true;
  }

  /**
   * Returning a FormGroup with process action fields
   * @param id
   * @param name
   * @param timeout
   * @param timeunit
   * @param retries
   * @param mandatory
   * @param method
   * @returns {FormGroup}
   */
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
    });
  }

  /**
   * Returning a FormGroup with action params fields
   * @param code
   * @param value
   * @param id
   * @param viewName
   * @param name
   * @param type
   * @returns {FormGroup}
   */
  initActionParamController(code?, value?, id?, viewName?, name?, type?) {
    return new FormGroup({
      code: new FormControl(code),
      value: new FormControl(value),
      param: new FormControl(id),
      viewName: new FormControl(viewName),
      name: new FormControl(name),
      type: new FormControl(type)
    });
  }

  /**
   * Called from the template once user changes a method
   */
  onSelectMethod() {
    this.selectedMethod = this.processForm.value.actions[this.index].method;
    /* when a method selected - change the form params*/
    const methodName = this.processForm.value.actions[this.index].method;
    const action = this.processForm.controls['actions']['controls'][this.index];
    action.controls.params.setControl([]);
    const method = this.plugin.methods.find((o) => o.name === methodName);
    if (!method) {
      this.socketService.setNotification({ title: 'OH OH', message: 'Unexpected error, please try again.' });
      return;
    }
    method.params.forEach(param => {
      action.controls.params.push(this.initActionParamController(null, null, param._id, param.viewName, param.name, param.type));
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
    }, 0)
  }

}
