import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersManagementComponent } from './users-management.component';
import { UsersListComponent } from './users-list/users-list.component';
import { UsersListResolver } from './resolvers/users-list.resolver';

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
        resolve: {users: UsersListResolver}
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersManagementRoutingModule {}
