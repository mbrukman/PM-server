import { Component, OnInit,forwardRef, Input, EventEmitter, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import { SelectItem } from 'primeng/primeng';

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
  @Output() onChange: EventEmitter<any> = new EventEmitter<any>();
  text :string = "";
  propagateChange : (_: any) => { };
  optionsDropDown:SelectItem[] = [];

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

  onSelect(e){
    this.propagateChange(this.text)
    this.onChange.emit(e);
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
