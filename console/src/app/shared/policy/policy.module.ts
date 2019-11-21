import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyComponent } from '@app/users-management/policies/policy/policy.component';
import { InputsModule } from '@shared/inputs/inputs.module';

@NgModule({
  declarations: [
    PolicyComponent
  ],
  imports: [
    CommonModule,
    InputsModule,
  ],
  exports: [
    PolicyComponent
  ]
})
export class PolicyModule { }
