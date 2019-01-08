import { AgentsListComponent } from '@agents/agents-list/agents-list.component';
import { GroupsComponent } from '@agents/groups/groups.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgentsComponent } from '@agents/agents/agents.component';
import { PluginsListComponent } from '@plugins/plugins-list/plugins-list.component';
import { AdminComponent } from './admin.component';
import { VaultComponent } from 'app/vault/vault/vault.component';

import {PluginSettingsComponent} from '@plugins/plugin-settings/plugin-settings.component'
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/admin/plugins'
  },
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'plugins',
        component: PluginsListComponent
      },
      {
        path:'plugins/:id/settings',
        component:PluginSettingsComponent
      },
      {
        path: 'agents',
        component: AgentsComponent,
        children: [
          { path: '', component: AgentsListComponent },
          { path: 'groups', component: GroupsComponent }
        ]
      },
      {
        path: 'calendar',
        loadChildren: '../calendar/calendar.module#CalendarModule'
      },
      {
        path: 'vault',
        component: VaultComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {
}
