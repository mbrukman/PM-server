import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AgentsListComponent } from '../agents/agents-list/agents-list.component';
import { PluginUploadComponent } from '../plugins/plugin-upload/plugin-upload.component';
import { PluginsListComponent } from '../plugins/plugins-list/plugins-list.component';
import { AddFolderComponent } from '../agents/agents-list/add-folder/add-folder.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    TooltipModule,
    SharedModule
  ],
  declarations: [
    AdminComponent,
    PluginUploadComponent,
    PluginsListComponent,
    AgentsListComponent,
    AddFolderComponent,
  ],
  entryComponents: [PluginUploadComponent, AddFolderComponent],
})
export class AdminModule { }
