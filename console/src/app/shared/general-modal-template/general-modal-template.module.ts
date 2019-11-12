import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralModalTemplateComponent } from './general-modal-template.component';

@NgModule({
  declarations: [GeneralModalTemplateComponent],
  exports: [
    GeneralModalTemplateComponent
  ],
  imports: [
    CommonModule
  ]
})
export class GeneralModalTemplateModule { }
