import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UserGroupModule} from '@app/iam/user-group/user-group.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserGroupModule
  ]
})
export class IAMModule { }
