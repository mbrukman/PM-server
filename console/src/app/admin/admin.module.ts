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
import { EvaluateGroupAgentComponent } from '@agents/groups/evaluate-group-agent/evaluate-group-agent.component';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';
import {EditGroupComponent} from '@agents/edit-group/edit-group.component';
import {ConstantsListComponent} from '@agents/agents-list/constants-list/constants-list.component';
import {GroupDynamicConditionFilterPopupComponent} from '@agents/groups/group-dynamic-condition-filter-popup/group-dynamic-condition-filter-popup.component';
import {FilterGroupListComponent} from '@agents/groups/filter-group-list/filter-group-list.component';

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
    EvaluateGroupAgentComponent,
    EditAgentComponent,
    EditGroupComponent,
    ConstantsListComponent,
    GroupDynamicConditionFilterPopupComponent,
    FilterGroupListComponent

  ],
  entryComponents: [PluginUploadComponent, AddFolderComponent, InputPopupComponent, EditAgentComponent, EditGroupComponent,GroupDynamicConditionFilterPopupComponent]
})
export class AdminModule { }
