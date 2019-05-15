import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { Job } from './models/job.model';



@Injectable()
export class CalendarService {
  newJob: Subject<any> = new Subject();

  constructor(private http: HttpClient) {
  }

  create(mapId: string, job) {
    return this.http.post<Job>(`api/scheduled-jobs`, job);
  }

  deleteJob(jobId: string) {
    return this.http.delete<string>(`api/scheduled-jobs/${jobId}`, { responseType: 'text' as 'json' });
  }

  getFutureJobs() {
    return this.http.get<Job[]>(`api/scheduled-jobs/getFutureJobs`);
  }

  newJobAsObservable() {
    return this.newJob.asObservable();
  }

  list() {
    return this.http.get<Job[]>(`api/scheduled-jobs`);
  }

  setNewJob(job: Job) {
    this.newJob.next(job);
  }

  updateJob(job) {
    return this.http.put<Job>(`api/scheduled-jobs`, job);
  }

}
