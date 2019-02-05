import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Job } from './models/job.model';

const serverUrl = environment.serverUrl;


@Injectable()
export class CalendarService {
  newJob: Subject<any> = new Subject();

  constructor(private http: HttpClient) {
  }

  create(mapId: string, job) {
    return this.http.post<Job>(`${serverUrl}api/scheduled-jobs`, job);
  }

  deleteJob(jobId: string) {
    return this.http.delete<string>(`${serverUrl}api/scheduled-jobs/${jobId}`, { responseType: 'text' as 'json' });
  }

  getFutureJobs() {
    return this.http.get<Job[]>(`${serverUrl}api/scheduled-jobs/getFutureJobs`);
  }

  newJobAsObservable() {
    return this.newJob.asObservable();
  }

  list() {
    return this.http.get<Job[]>(`${serverUrl}api/scheduled-jobs`);
  }

  setNewJob(job: Job) {
    this.newJob.next(job);
  }

  updateJob(job) {
    return this.http.put<Job>(`${serverUrl}api/scheduled-jobs`, job);
  }

}
