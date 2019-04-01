import { Component, OnInit,forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-options-param',
  templateUrl: './options-param.component.html',
  styleUrls: ['./options-param.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OptionsParamComponent),
      multi: true
    }
  ]
})
export class OptionsParamComponent implements OnInit, ControlValueAccessor {
  @Input('options') options:any;
  text :string = "";
  propagateChange : (_: any) => { };
  optionsDropDown:any;

  constructor() { }

  ngOnInit() {
    if(!this.options[0].label){
      this.optionsDropDown = this.options.map((opt) => {
        return {label:opt.name,value:opt.id}
      })
    }
    else{
      this.optionsDropDown = this.options
    }
  }

  onSelect(){
    this.propagateChange(this.text)
  }

  // interface implementation//
  writeValue(obj: any): void {
    if (obj !== undefined)
      this.text = obj;
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {}
  

}
