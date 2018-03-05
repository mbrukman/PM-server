import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import {
  addDays,
  addHours,
  addWeeks,
  endOfDay,
  endOfMonth,
  isSameDay,
  isSameMonth,
  startOfDay,
  subDays
} from 'date-fns';
import { CalendarEvent } from 'angular-calendar';
import * as cronParser from 'cron-parser';
import * as moment from 'moment';

import { CalendarService } from '../calendar.service';
import { Job } from '../models/job.model';
import { Map } from '@maps/models';
import { BsModalService } from 'ngx-bootstrap';
import { ConfirmComponent } from '@shared/confirm/confirm.component';

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

enum DeleteOptions {
  skip = 'skip next job',
  cancel = 'cancel',
  delete = 'delete all jobs'
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  viewDate = new Date();
  events: CalendarEvent[] = [];
  activeDayIsOpen: boolean = false;
  refreshCalendar: Subject<any> = new Subject();
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private calendarService: CalendarService, private modalService: BsModalService) {
  }

  ngOnInit() {
    this.calendarService.list()
      .takeUntil(this.destroy$)
      .subscribe(jobs => {
        jobs.forEach(job => {
          this.addNewEvent(this.createCalendarEventFromJob(job));
        });
      });

    this.calendarService.newJobAsObservable()
      .takeUntil(this.destroy$)
      .subscribe(job => {
        if (job) {
          this.addNewEvent(this.createCalendarEventFromJob(job));
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  addNewEvent(event) {
    event = Array.isArray(event) ? [...event] : [event];
    this.events = [...this.events, ...event];
    this.refreshCalendar.next();
  }

  createMonthEventsFromCron(job) {
    let crons = [];
    let endDate = moment().add('6', 'M').toDate(); // setting end date to 6 month from now;
    const interval = cronParser.parseExpression(job.cron, { endDate });
    let flag = true;
    while (flag) {
      try {
        let obj = interval.next();
        if (crons.findIndex(sj => (job.id === sj.job.id) && (JSON.stringify(startOfDay(obj.toDate())) === JSON.stringify(sj.start))) > -1) {
          continue;
        }
        crons.push({
          start: startOfDay(obj.toDate()),
          title: (<Map>job.map).name,
          color: colors.yellow,
          job: job,
          datetime: job.datetime,
          map: job.map
        });
      } catch (e) { flag = false;}
    }

    return crons;
  }

  createCalendarEventFromJob(job: Job) {
    if (job.cron) {
      return this.createMonthEventsFromCron(job);
    } else {
      return {
        start: startOfDay(job.datetime),
        title: job.map ? (<Map>job.map).name : '',
        color: colors.yellow,
        job: job,
        datetime: job.datetime,
        map: job.map
      };
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

  deleteJob(job) {
    const jobIndex = this.events.findIndex((o, i) => {
      return job.id === (<any>o).job.id;
    });

    if (job.type === 'once') {
      return this.calendarService.deleteJob(job.id)
        .take(1)
        .subscribe(() => {
          this.events.splice(jobIndex, 1);
          this.refreshCalendar.next();
        });
    }
    const modal = this.modalService.show(ConfirmComponent);
    modal.content.message = 'How would you like to proceed?';
    modal.content.confirm = DeleteOptions.delete;
    modal.content.cancel = DeleteOptions.cancel;
    modal.content.third = DeleteOptions.skip;
    modal.content.result
      .take(1)
      .subscribe(result => {
        switch (result) {
          case DeleteOptions.delete:
            this.calendarService.deleteJob(job.id)
              .take(1)
              .subscribe(() => {
                this.events = this.events.reduce((total, current) => {
                  if ((<any>current).job.id !== job.id) {
                    total.push(current);
                  }
                  return total;
                }, []);

                this.refreshCalendar.next();
              });
            break;
          case DeleteOptions.skip:
            job.skip = true;
            this.calendarService.updateJob(job)
              .take(1)
              .subscribe();
            break;
          default:
            break;
        }
      });
  }
}
