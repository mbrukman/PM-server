import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserGroupListComponent} from '@app/users-management/user-group/user-group-list/user-group-list.component';
import {ModalModule, TooltipModule} from 'ngx-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '@app/shared/shared.module';
import {UserGroupDetailsComponent} from './user-group-details/user-group-details.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { UserGroupDetailsUsersComponent } from './user-group-details-users/user-group-details-users.component';
import { UserGroupAttachUsersModalComponent } from './user-group-details-users/user-group-attach-users-modal/user-group-attach-users-modal.component';
import {GeneralModalTemplateModule} from '@shared/general-modal-template/general-modal-template.module';
import {TableModule} from 'primeng/table';
import {InputsModule} from '@shared/inputs/inputs.module';
import {RouterModule} from '@angular/router';

@NgModule({
  entryComponents: [
    UserGroupAttachUsersModalComponent
  ],
  declarations: [
    UserGroupListComponent,
    UserGroupDetailsComponent,
    UserGroupDetailsUsersComponent,
    UserGroupAttachUsersModalComponent
  ],
  imports: [
    TooltipModule,
    CommonModule,
    FormsModule,
    ModalModule,
    TableModule,
    RouterModule,
    InputsModule,
    SharedModule,
    ReactiveFormsModule,
    TabsModule.forRoot(),
    GeneralModalTemplateModule,
  ]
})
export class UserGroupModule {
}
