import { Component, OnInit,forwardRef, Input,ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {AutoCompleteService} from '@shared/components/params/autocomplete.service';
import {AutoCompleteItem} from '@shared/model/autocomplete.model';
import { debounceTime  } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements OnInit, ControlValueAccessor,OnDestroy {
  @Input('model') model:string;
  results: AutoCompleteItem[];
  text: AutoCompleteItem;
  options = { query: ""}
  propagateChange : (_: any) => { };
  autoCompleteSubscribe : Subscription;

  constructor(private autoCompleteService:AutoCompleteService) { }
  @ViewChild('autoComplete') autoCompleteElement : ElementRef;
  ngOnInit() {
   this.autoCompleteSubscribe = this.autoCompleteElement['completeMethod'].pipe(debounceTime(800))
   .subscribe((event)=> {
     this.search(event)
   })
  }

  ngOnDestroy(){
    this.autoCompleteSubscribe.unsubscribe();
  }

  onSelect(){
    this.propagateChange(this.text.id);
  }

  mapResult(autoCompleteItem:AutoCompleteItem[]) {
    this.results = []
    autoCompleteItem.forEach(item => {
      this.results.push(item);
    })
  }

  search(event) {
    this.options.query = event.query;
    if(event.query !=""){
      this.autoCompleteService.generateAutoCompleteParams(this.model,this.options).subscribe(autoCompleteItem => {
        this.mapResult(autoCompleteItem)
      });
    }
  }

  // interface implementation//
  writeValue(obj: any): void {
    if (obj){
      this.text = {id : obj,value:""};
      this.autoCompleteService.getValueById(this.text.id,this.model)
      .subscribe(val => {
        this.text = val
      })
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {}
 
}
