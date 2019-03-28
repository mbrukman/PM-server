import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ProjectCreateComponent } from './project-create/project-create.component';
import { ImportModalComponent } from './project-details/import-modal/import-modal.component';
import { ProjectsResolver } from './resolvers/projects-resolver.resolver';

@NgModule({
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    SharedModule
  ],
  declarations: [
    ProjectsListComponent,
    ProjectDetailsComponent,
    ProjectCreateComponent,
    ImportModalComponent
  ],
  providers:[ProjectsResolver],
  entryComponents: [ImportModalComponent]
})
export class ProjectsModule {
}
