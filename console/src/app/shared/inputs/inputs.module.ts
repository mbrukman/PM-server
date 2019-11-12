import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FilterTextInputComponent} from './filter-text-input/filter-text-input.component';
import { BasicInputComponent } from './basic-text-input/basic-input.component';
import { CheckboxComponent } from './checkbox/checkbox.component';

@NgModule({
  declarations:
    [
      FilterTextInputComponent,
      BasicInputComponent,
      CheckboxComponent
    ],
  exports: [
    FilterTextInputComponent,
    CheckboxComponent
  ],
  imports: [
    CommonModule
  ]
})
export class InputsModule {
}
