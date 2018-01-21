import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CalendarContainerComponent } from './calendar-container/calendar-container.component';

const routes: Routes = [
  {
    path: '',
    component: CalendarContainerComponent
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule {
}
