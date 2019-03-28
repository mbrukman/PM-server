import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ProjectCreateComponent } from './project-create/project-create.component';
import { ProjectsResolver } from './resolvers/projects-resolver.resolver';

const routes: Routes = [
  {
    path: '',
    component: ProjectsListComponent,
    resolve:{projects: ProjectsResolver}
  },
  {
    path: 'create',
    component: ProjectCreateComponent
  },
  {
    path: 'update',
    component: ProjectCreateComponent
  },
  {
    path: ':id',
    component: ProjectDetailsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { }
