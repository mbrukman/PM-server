import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasicPolicyComponent } from '@app/users-management/policies/basic-policy/basic-policy.component';
import { InputsModule } from '@shared/inputs/inputs.module';
import { ProjectPolicyComponent } from '@app/users-management/policies/project-policy/project-policy.component';

@NgModule({
  declarations: [
    BasicPolicyComponent,
    ProjectPolicyComponent,
  ],
  imports: [
    CommonModule,
    InputsModule,
  ],
  exports: [
    BasicPolicyComponent,
    ProjectPolicyComponent,
  ]
})
export class PolicyModule { }
