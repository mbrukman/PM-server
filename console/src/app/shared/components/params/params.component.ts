import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'app-params',
  templateUrl: './params.component.html',
  styleUrls: ['./params.component.scss']
})
export class ParamsComponent implements OnInit {

  @Input('form') form:FormGroup;
  @Input('params') params:any[];
  @Input('code') code:boolean = true;

  get paramsForm(): FormArray {
    return <FormArray>this.form.get('params')
  }

  constructor() { }

  ngOnInit() {
  }
}
