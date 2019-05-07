import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ProjectCreateComponent } from './project-create/project-create.component';
import { ProjectsResolver } from './resolvers/projects-resolver.resolver';
import {ProjectDetailsResolver} from './resolvers/project-details.resolver';

@NgModule({
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    SharedModule
  ],
  declarations: [
    ProjectsListComponent,
    ProjectDetailsComponent,
    ProjectCreateComponent
  ],
  providers:[ProjectsResolver,ProjectDetailsResolver],
  entryComponents: []
})
export class ProjectsModule {
}
