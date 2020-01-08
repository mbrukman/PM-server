import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TosComponent } from './tos.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [TosComponent],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class TosModule { }
