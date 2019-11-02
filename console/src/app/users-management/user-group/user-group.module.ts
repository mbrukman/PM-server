import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserGroupListComponent} from '@app/users-management/user-group/user-group-list/user-group-list.component';
import {UserGroupCreateModalComponent} from './user-group-list/user-group-create-modal/user-group-create-modal.component';
import {ModalModule} from 'ngx-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@NgModule({
  entryComponents: [UserGroupCreateModalComponent],
  declarations: [UserGroupListComponent, UserGroupCreateModalComponent, UserGroupCreateModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalModule
  ]
})
export class UserGroupModule {
}
