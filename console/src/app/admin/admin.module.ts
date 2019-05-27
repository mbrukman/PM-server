import { AgentsComponent } from '@agents/agents/agents.component';
import { GroupsComponent } from '@agents/groups/groups.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { AccordionModule } from 'ngx-bootstrap/accordion';

import { AgentsListComponent } from '@agents/agents-list/agents-list.component';
import { PluginsListComponent } from '@plugins/plugins-list/plugins-list.component';
import { SharedModule } from '@shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import {ConstantAgentsListComponent} from '@agents/agents-list/constant-agents-list/constant-agents-list.component';
import {AgentsGroupFiltersListComponent} from '@agents/groups/agents-group-filters-list/agents-group-filters-list.component'
import { VaultComponent } from '../vault/vault/vault.component'
import {PluginSettingsComponent} from '@plugins/plugin-settings/plugin-settings.component'


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
    PluginsListComponent,
    PluginSettingsComponent,
    AgentsListComponent,
    AgentsComponent,
    GroupsComponent,
    ConstantAgentsListComponent,
    AgentsGroupFiltersListComponent,
    VaultComponent,
  ],
  entryComponents: []
})
export class AdminModule { }
