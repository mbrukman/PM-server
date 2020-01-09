import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsOfUseComponent } from './terms-of-use.component';
import {FormsModule} from '@angular/forms';

@NgModule({
  declarations: [TermsOfUseComponent],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class TermsOfUseModule { }
