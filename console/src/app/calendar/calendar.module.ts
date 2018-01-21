import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PopoverModule } from 'ngx-bootstrap/popover';
import { CalendarModule as AngularCalendarModule } from 'angular-calendar';
import { CronJobsModule } from 'ngx-cron-jobs';
import { CalendarModule as PrimeCalendarModule } from 'primeng/primeng';

import { AddJobComponent } from './add-job/add-job.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarContainerComponent } from './calendar-container/calendar-container.component';
import { CalendarRoutingModule } from './calendar-routing.module';


@NgModule({
  declarations: [
    AddJobComponent,
    CalendarComponent,
    CalendarContainerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CalendarRoutingModule,
    // angular-calendar
    AngularCalendarModule.forRoot(),
    // ngx-bootstrap
    PopoverModule.forRoot(),
    // ngx-cron-jobs
    CronJobsModule,
    // primeng
    PrimeCalendarModule
  ],
  exports: [
    CalendarContainerComponent
  ]
})
export class CalendarModule {
}
