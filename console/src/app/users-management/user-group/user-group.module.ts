import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserGroupListComponent} from '@app/users-management/user-group/user-group-list/user-group-list.component';
import {ModalModule} from 'ngx-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [UserGroupListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule,
    SharedModule
  ],
})
export class UserGroupModule {
}
