import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs/Subject';
import { environment } from '../../environments/environment';
import { Job } from './models/job.model';

const serverUrl = environment.serverUrl;


@Injectable()
export class CalendarService {
  newJob: Subject<any> = new Subject();

  constructor(private http: HttpClient) {
  }

  create(mapId: string, job) {
    console.log('HI');
    return this.http.post<Job>(`${serverUrl}api/maps/${mapId}/jobs/create`, job);
  }

  deleteJob(mapId, jobId) {
    return this.http.delete<string>(`${serverUrl}api/maps/${mapId}/jobs/${jobId}/delete`, { responseType: 'text' as 'json' });
  }

  getFutureJobs() {
    return this.http.get<Job[]>(serverUrl + 'api/maps/scheduledJob/getFutureJobs');
  }

  newJobAsObservable() {
    return this.newJob.asObservable();
  }

  list() {
    return this.http.get<Job[]>(`${serverUrl}api/maps/jobs`);
  }

  setNewJob(job: Job) {
    this.newJob.next(job);
  }

  updateJob(job) {
    return this.http.put<Job>(serverUrl + 'api/maps/scheduledJob/updateJob', job);
  }

}
