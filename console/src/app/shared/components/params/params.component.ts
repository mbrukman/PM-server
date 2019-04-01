import { Component, OnInit, Input, OnChanges } from '@angular/core';
import {PluginMethodParam} from '@plugins/models/plugin-method-param.model';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-params',
  templateUrl: './params.component.html',
  styleUrls: ['./params.component.scss']
})
export class ParamsComponent implements OnInit {

  @Input('form') form:FormGroup;
  @Input('params') params:any[];
  @Input('code') code:boolean = true;

  constructor() { }

  ngOnInit() {

  }
}
