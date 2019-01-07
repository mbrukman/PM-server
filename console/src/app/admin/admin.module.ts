import { AgentsComponent } from '@agents/agents/agents.component';
import { GroupsComponent } from '@agents/groups/groups.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AccordionModule } from 'ngx-bootstrap/accordion';

import { AddFolderComponent } from '@agents/agents-list/add-folder/add-folder.component';
import { AgentsListComponent } from '@agents/agents-list/agents-list.component';
import { PluginUploadComponent } from '@plugins/plugin-upload/plugin-upload.component';
import { PluginsListComponent } from '@plugins/plugins-list/plugins-list.component';
import { SharedModule } from '@shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { InputPopupComponent } from '@agents/groups/input-popup/input-popup.component';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';
import {AgentsGroupUpsertComponent} from '@agents/agents-group-upsert/agents-group-upsertcomponent';
import {ConstantAgentsListComponent} from '@agents/agents-list/constant-agents-list/constant-agents-list.component';
import {AgentsGroupUpsertFilterComponent} from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import {AgentsGroupFiltersListComponent} from '@agents/groups/agents-group-filters-list/agents-group-filters-list.component'

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    TooltipModule,
    AccordionModule,
    SharedModule
  ],
  declarations: [
    AdminComponent,
    PluginUploadComponent,
    PluginsListComponent,
    AgentsListComponent,
    AddFolderComponent,
    AgentsComponent,
    GroupsComponent,
    InputPopupComponent,
    EditAgentComponent,
    AgentsGroupUpsertComponent,
    ConstantAgentsListComponent,
    AgentsGroupUpsertFilterComponent,
    AgentsGroupFiltersListComponent
 
  ],
  entryComponents: [PluginUploadComponent, AddFolderComponent, InputPopupComponent, EditAgentComponent, AgentsGroupUpsertComponent,AgentsGroupUpsertFilterComponent]
})
export class AdminModule { }
