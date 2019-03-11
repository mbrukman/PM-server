import { AfterContentInit, Component, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap';
import * as _ from 'lodash';

import { PluginsService } from '@plugins/plugins.service';
import { Plugin, PluginMethod, PluginMethodParam } from '@plugins/models';
import { MapTrigger } from '@maps/models';

@Component({
  selector: 'app-trigger-form',
  templateUrl: './trigger-form.component.html',
  styleUrls: ['./trigger-form.component.scss']
})
export class TriggerFormComponent implements AfterContentInit, OnDestroy {
  params: PluginMethodParam[];
  public result: Subject<any> = new Subject();
  configurations: string[]; 
  configDropDown:any;
  triggerForm: FormGroup;
  triggers: Plugin[];
  pluginsReq: any;
  trigger: MapTrigger;
  method: PluginMethod;
  plugin: Plugin;


  constructor(public bsModalRef: BsModalRef, private pluginsService: PluginsService) {
  }

  ngAfterContentInit() {
    this.pluginsReq = this.pluginsService.list().subscribe(plugins => {
      this.triggers = plugins.filter(plugin => {
        return plugin.type === 'trigger' || plugin.type === 'server' || plugin.type === 'module';
      });
      this.configDropDown = this.configurations.map(config => {
        return {name:config}
      })
      if (this.triggers) {
        this.initTriggerForm();
        if (this.trigger) {
          this.onSelectTrigger();
          this.method = _.find(this.plugin.methods, (o) => o.name === this.triggerForm.value.method.name);
          this.params = this.method.params;
          let paramsControl = <FormArray>this.triggerForm.controls['params'];
          this.trigger.params.forEach(param => {
            paramsControl.push(this.initParamsForm(param.value, param.param, param.viewName, param.name));
          });
        }
      }
    });
  }

  ngOnDestroy() {
    this.pluginsReq.unsubscribe();
  }

  initTriggerForm() {
    this.triggerForm = new FormGroup({
      name: new FormControl(this.trigger ? this.trigger.name : null, Validators.required),
      description: new FormControl(),
      plugin: new FormControl(this.trigger ? this.trigger.plugin : null, Validators.required),
      configuration: new FormControl(this.trigger ? this.trigger.method : null),
      method: new FormControl( this.trigger ? this.trigger.method : null, Validators.required),
      params: new FormArray([])
    });
  }

  initParamsForm(value?, id?, viewName?, name?) {
    return new FormGroup({
      value: new FormControl(value),
      param: new FormControl(id, Validators.required),
      viewName: new FormControl(viewName, Validators.required),
      name: new FormControl(name, Validators.required)
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

  onSelectTrigger() {
    if(this.plugin){
  
      this.removeParamForm()
      this.plugin = _.find(this.triggers, (o) => o.name === this.triggerForm.value.plugin.name);
      this.method = this.plugin.methods[0] // if there is a plugin, by default the method will be the first element
      this.addParamForm()
    }
    else{
      this.plugin = _.find(this.triggers, (o) => o.name === this.triggerForm.value.plugin.name);
    }
  }

  onSelectMethod() {
    if(this.method){
      this.removeParamForm()
    }
    this.method = _.find(this.plugin.methods, (o) => o.name === this.triggerForm.value.method.name);
    this.params = this.method.params;
    this.addParamForm()
  }

  addParamForm(){
    let paramsControl = <FormArray>this.triggerForm.controls['params'];
    this.method.params.forEach(param => {
      paramsControl.push(this.initParamsForm(param.value, param._id, param.viewName, param.name));
    });
  }

  removeParamForm(){
    let paramsControl = <FormArray>this.triggerForm.controls['params'];
      for(let i =0,length = this.method.params.length;i<length;i++){
        paramsControl.removeAt(0)
      }
  }

}
