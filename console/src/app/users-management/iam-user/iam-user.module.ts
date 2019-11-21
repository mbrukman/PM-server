import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserDetailsGroupsComponent } from '@app/users-management/iam-user/user-details-groups/user-details-groups.component';
import { CreateUserComponent } from '@app/users-management/iam-user/users-list/create-user/create-user.component';
import { EditUserComponent } from '@app/users-management/iam-user/users-list/edit-user/edit-user.component';
import { UserDetailsComponent } from '@app/users-management/iam-user/user-details/user-details.component';
import { UsersListComponent } from '@app/users-management/iam-user/users-list/users-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { ModalModule, TabsModule, TooltipModule } from 'ngx-bootstrap';
import { InputsModule } from '@shared/inputs/inputs.module';
import { GeneralModalTemplateModule } from '@shared/general-modal-template/general-modal-template.module';
import { TableModule } from 'primeng/table';
import { RouterModule } from '@angular/router';
import { UserAttachUserGroupModalComponent } from '@app/users-management/iam-user/user-details-groups/user-attach-user-group-modal/user-attach-user-group-modal.component';
import { PolicyModule } from '@app/shared/policy/policy.module';

@NgModule({
  entryComponents: [UserAttachUserGroupModalComponent],
  declarations: [
    UserDetailsComponent,
    CreateUserComponent,
    EditUserComponent,
    UsersListComponent,
    UserDetailsGroupsComponent,
    UserAttachUserGroupModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputsModule,
    GeneralModalTemplateModule,
    SharedModule,
    ModalModule,
    TooltipModule.forRoot(),
    TableModule,
    RouterModule,
    TabsModule.forRoot(),
    PolicyModule
  ]
})
export class IAMUserModule { }
