import { Component, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
  addWeeks
} from 'date-fns';
import { CalendarEvent } from 'angular-calendar';


import { CalendarService } from '../calendar.service';
import { Job } from '../models/job.model';
import { Map } from '../../maps/models/map.model';

const colors: any = {
  // TODO: add color pallet
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  viewDate = new Date();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = false;
  refreshCalendar: Subject<any> = new Subject();
  newJobSubscription: Subscription;

  constructor(private calendarService: CalendarService) {
  }

  ngOnInit() {
    this.calendarService.list().subscribe(jobs => {
      jobs.forEach(job => {
        this.addNewEvent(this.createCalendarEventFromJob(job));
      });
    });
    this.newJobSubscription = this.calendarService.newJobAsObservable().subscribe(job => {
      if (job) {
        this.addNewEvent(this.createCalendarEventFromJob(job));
      }
    });
  }

  addNewEvent(event) {
    event = Array.isArray(event) ? [...event] : [event];
    this.events.push(event);
    this.events = [...this.events, ...event];
    this.refreshCalendar.next();
  }


  createMonthEventsFromCron(job) {
    const cron = job.cron
    let crons = [];
    let r = cron.split(' ');
    if (cron === '* * * * *' || cron === '*/1 * * * *') {
      for (let i = 0; i < 31; i++) {
        crons.push(
          {
            start: startOfDay(addDays(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1), i)),
            title: (<Map>job.map).name,
            color: colors.yellow,
            job: job,
            datetime: job.datetime,
            map: job.map
          }
        );
      }
    } else {
      if (r[2] !== '*') {
        if (r[3] === '*') { // certain day on every month
          crons.push(
            {
              start: startOfDay(addDays(new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1), r[2] - 1)),
              title: (<Map>job.map).name,
              color: colors.yellow,
              job: job,
              datetime: job.datetime,
              map: job.map
            }
          );
        } else { // every month in certain day
          crons.push(
            {
              start: startOfDay(new Date(this.viewDate.getFullYear(), r[3], 1)),
              title: (<Map>job.map).name,
              color: colors.yellow,
              job: job,
              datetime: job.datetime,
              map: job.map
            }
          );
        }
      } else {
        if (r[4] !== '*') {
          if (r[3] === '*') { // every week in certain day
            let todayDay = (new Date()).getDay();
            addDays(new Date(), r[4] - todayDay);
            for (let i = 0; i < 4; i++) {
              crons.push(
                {
                  start: startOfDay(addWeeks(addDays(new Date(), r[4] - todayDay), i)),
                  title: (<Map>job.map).name,
                  color: colors.yellow,
                  job: job,
                  datetime: job.datetime,
                  map: job.map
                }
              );

            }
          }
        }
      }
    }

    return crons;
  }

  createCalendarEventFromJob(job: Job) {
    if (job.cron) {
      return this.createMonthEventsFromCron(job);
    } else {
      return [{
        start: startOfDay(job.datetime),
        title: (<Map>job.map).name,
        color: colors.yellow,
        job: job,
        datetime: job.datetime,
        map: job.map
      }];
    }

  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) { // will not open details if it is not a day at current month
      if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
        // close the panel if it is the selected day or if that day has no events
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  deleteJob(jobId) {
    let index;
    const event = this.events.find((o, i) => {
      index = i;
      return jobId === (<any>o).job.id;
    });

    this.calendarService.deleteJob((<any>event).map.id, (<any>event).job.id).subscribe(() => {
      this.events.splice(index, 1);
      this.refreshCalendar.next();
    });
  }
}
