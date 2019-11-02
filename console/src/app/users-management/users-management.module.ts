import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UsersManagementComponent } from './users-management.component';
import { UsersManagementRoutingModule } from './users-management-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { UsersListComponent } from './users-list/users-list.component';
import { ManagementTableComponent } from './management-table/management-table.component';
import { SharedModule } from '@shared/shared.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { UsersListResolver } from './resolvers/users-list.resolver';
import {UserGroupModule} from '@app/users-management/user-group/user-group.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    UsersManagementRoutingModule,
    UserGroupModule ,
    TooltipModule.forRoot()
  ],
  declarations: [
    UsersManagementComponent,
    UsersListComponent,
    ManagementTableComponent
  ],
  providers: [UsersListResolver],
  entryComponents: []
})
export class UsersManagementModule {}
