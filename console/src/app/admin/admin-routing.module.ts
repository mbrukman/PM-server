import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AgentsListComponent } from '../agents/agents-list/agents-list.component';
import { CalendarContainerComponent } from '../calendar/calendar-container/calendar-container.component';
import { PluginsListComponent } from '../plugins/plugins-list/plugins-list.component';

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
        path: 'agents',
        component: AgentsListComponent
      },
      {
        path: 'calendar',
        loadChildren: '../calendar/calendar.module#CalendarModule'
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
