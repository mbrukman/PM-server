import {AfterContentInit, Component, OnDestroy} from '@angular/core';

import {Subject, Subscription} from 'rxjs';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import {BsModalRef} from 'ngx-bootstrap';
import * as _ from 'lodash';

import {PluginsService} from '@plugins/plugins.service';
import {Plugin, PluginMethod, PluginMethodParam} from '@plugins/models';
import {MapTrigger} from '@maps/models';
import {IParam} from '@shared/interfaces/param.interface';

@Component({
  selector: 'app-trigger-form',
  templateUrl: './trigger-form.component.html',
  styleUrls: ['./trigger-form.component.scss']
})
export class TriggerFormComponent implements AfterContentInit, OnDestroy {
  params: PluginMethodParam[];
  public result: Subject<any> = new Subject();
  configurations: string[];
  configDropDown: any;
  triggerForm: FormGroup;
  triggers: Plugin[];
  trigger: MapTrigger;
  method: PluginMethod;
  plugin: Plugin;

  private mainSubscription = new Subscription();

  constructor(public bsModalRef: BsModalRef, private pluginsService: PluginsService) {
  }

  ngAfterContentInit() {
    const listPluginSubscription = this.pluginsService.list().subscribe(plugins => {
      this.triggers = plugins.filter(plugin => {
        return plugin.type === 'trigger' || plugin.type === 'server' || plugin.type === 'module';
      });
      this.configDropDown = this.configurations.map(config => {
        return {name: config};
      });

      if (this.trigger) {
        this.onSelectTrigger(<string>this.trigger.plugin);
        this.onSelectMethod(<string>this.trigger.method);
        this.initTriggerForm();
        this.addParamForm(this.trigger.params);
      } else {
        this.initTriggerForm();
      }
    });

    this.mainSubscription.add(listPluginSubscription);
  }

  initTriggerForm() {
    this.triggerForm = new FormGroup({
      name: new FormControl(this.trigger ? this.trigger.name : null, Validators.required),
      description: new FormControl(),
      plugin: new FormControl(this.plugin ? this.plugin : null, Validators.required),
      configuration: new FormControl(this.trigger ? this.trigger.method : null),
      method: new FormControl(this.method ? this.method : null, Validators.required),
      params: new FormArray([])
    });
  }

  initParamsForm(value?, id?, viewName?, name?, type?) {
    return new FormGroup({
      value: new FormControl(value),
      param: new FormControl(id, Validators.required),
      viewName: new FormControl(viewName, Validators.required),
      name: new FormControl(name, Validators.required),
      type: new FormControl(type, Validators.required)
    });
  }

  onClose() {
    this.bsModalRef.hide();
  }

  onConfirm(form) {
    form.plugin = form.plugin.name;
    form.method = form.method.name;
    this.result.next(form);
    this.onClose();
  }

  onSelectTrigger(pluginToUse?: string) {
    const pluginName = pluginToUse ? pluginToUse : (this.triggerForm.value.plugin.name ? this.triggerForm.value.plugin.name : this.triggerForm.value.plugin);
    if (this.plugin) {

      this.removeParamForm();
      this.plugin = _.find(this.triggers, (o) => o.name === pluginName);
      this.method = this.plugin.methods[0]; // if there is a plugin, by default the method will be the first element
      this.addParamForm();
    } else {
      this.plugin = _.find(this.triggers, (o) => o.name === pluginName);
    }
  }

  onSelectMethod(methodToUse?: string) {
    const methodName = methodToUse ? methodToUse : (this.triggerForm.value.method.name ? this.triggerForm.value.method.name : this.triggerForm.value.method);
    if (this.method) {
      this.removeParamForm();
    }
    this.method = _.find(this.plugin.methods, (o) => o.name === methodName);
    this.params = this.method.params;
    if (this.triggerForm) {
      this.addParamForm();
    }
  }

  addParamForm(params?: IParam[]) {
    const paramsControl = <FormArray>this.triggerForm.controls['params'];
    params = params || this.method.params;
    params.forEach(param => {
      paramsControl.push(this.initParamsForm(param.value, param._id, param.viewName, param.name, param.type));
    });
  }

  removeParamForm() {
    const paramsControl = <FormArray>this.triggerForm.controls['params'];
    for (let i = 0, length = this.method.params.length; i < length; i++) {
      paramsControl.removeAt(0);
    }
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
