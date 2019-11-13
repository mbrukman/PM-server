import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UsersManagementComponent } from './users-management.component';
import { UsersManagementRoutingModule } from './users-management-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsersListComponent } from './users-list/users-list.component';
import { SharedModule } from '@shared/shared.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { UsersListResolver } from './resolvers/users-list.resolver';
import { UserGroupModule } from '@app/users-management/user-group/user-group.module';
import { UserGroupResolver } from './resolvers/user-group.resolver';
import { CreateUserComponent } from './iam-user/users-list/create-user/create-user.component';
import {IAMUserModule} from '@app/users-management/iam-user/iam-user.module';

@NgModule({
  entryComponents: [CreateUserComponent],
  imports: [
    IAMUserModule,
    CommonModule,
    UsersManagementRoutingModule,
    UserGroupModule,
  ],
  declarations: [
    UsersManagementComponent,
    UsersListComponent,
    CreateUserComponent,
    // ManageUserComponent,
    // EditUserComponent,
  ],
  providers: [UsersListResolver, UserGroupResolver]
})
export class UsersManagementModule { }
