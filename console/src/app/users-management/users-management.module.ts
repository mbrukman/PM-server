import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UsersManagementComponent } from './users-management.component';
import { UsersManagementRoutingModule } from './users-management-routing.module';
import { UsersListResolver } from './resolvers/users-list.resolver';
import { IAMUserGroup } from '@app/users-management/iam-user-group/iam-user-group';
import { UserGroupResolver } from './resolvers/user-group.resolver';
import { CreateUserComponent } from './iam-user/users-list/create-user/create-user.component';
import {IAMUserModule} from '@app/users-management/iam-user/iam-user.module';

@NgModule({
  entryComponents: [CreateUserComponent],
  imports: [
    IAMUserModule,
    CommonModule,
    UsersManagementRoutingModule,
    IAMUserGroup,
  ],
  declarations: [
    UsersManagementComponent,
  ],
  providers: [UsersListResolver, UserGroupResolver]
})
export class UsersManagementModule { }
