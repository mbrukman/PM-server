import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasicPolicyComponent } from '@app/users-management/policies/basic-policy/basic-policy.component';
import { InputsModule } from '@shared/inputs/inputs.module';

@NgModule({
  declarations: [
    BasicPolicyComponent
  ],
  imports: [
    CommonModule,
    InputsModule,
  ],
  exports: [
    BasicPolicyComponent
  ]
})
export class PolicyModule { }
