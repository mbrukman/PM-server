import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';


const serverUrl = environment.serverUrl;


@Injectable()
export class SetupService {
  public setup: boolean;
  constructor(private http: HttpClient) {}

  isSetup() {
    return this.http.get<boolean>(`${serverUrl}api/setup/issetup`);
  }

  setupDbConnectionString(data) {
    return this.http.post(`${serverUrl}api/setup/db`, data);
  }
}
