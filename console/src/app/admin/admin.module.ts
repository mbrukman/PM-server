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
import { GroupDynamicConditionFilterComponent } from '@agents/groups/group-dynamic-condition-filter/group-dynamic-condition-filter.component';
import { InputPopupComponent } from '@agents/groups/input-popup/input-popup.component';
import { EvaluateGroupAgentComponent } from '@agents/groups/evaluate-group-agent/evaluate-group-agent.component';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';
import { VaultComponent } from '../vault/vault/vault.component'
import  { VaultFormComponent} from '../vault/vault-form/vault-form.component'


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
    GroupDynamicConditionFilterComponent,
    InputPopupComponent,
    EvaluateGroupAgentComponent,
    EditAgentComponent,
    VaultComponent,VaultFormComponent
  ],
  entryComponents: [PluginUploadComponent, AddFolderComponent, InputPopupComponent, EditAgentComponent,VaultFormComponent]
})
export class AdminModule { }
