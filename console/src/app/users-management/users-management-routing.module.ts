import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {UsersManagementComponent} from '@app/users-management/users-management.component';
import {UsersListComponent} from '@app/users-management/iam-user/users-list/users-list.component';
import {UsersListResolver} from '@app/users-management/resolvers/users-list.resolver';
import {UserGroupListComponent} from '@app/users-management/user-group/user-group-list/user-group-list.component';
import {UserGroupResolver} from '@app/users-management/resolvers/user-group.resolver';
import {UserGroupDetailsComponent} from '@app/users-management/user-group/user-group-details/user-group-details.component';
import {UserDetailsComponent} from '@app/users-management/iam-user/user-details/user-details.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    component: UsersManagementComponent,
    children: [
      {
        path: 'users',
        component: UsersListComponent,
        resolve: { users: UsersListResolver }
      },
      {
        path: 'users/:id',
        component: UserDetailsComponent
      },
      {
        path: 'groups',
        component: UserGroupListComponent,
        resolve: { groups: UserGroupResolver }
      }, {
        path: 'groups/:id',
        component: UserGroupDetailsComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersManagementRoutingModule {
}
