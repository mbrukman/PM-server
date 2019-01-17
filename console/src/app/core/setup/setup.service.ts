import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';


const serverUrl = environment.serverUrl;

class Settings {
  isSetup : boolean;
  version : string;
}

@Injectable()
export class SettingsService {
  public settings : Settings;
  constructor(private http: HttpClient) {}

  getSettings() : Observable<Settings> {
    return this.http.get<Settings>(`${serverUrl}api/settings`).map(settings=>{
      this.settings = settings;
      return settings;
    });
  }

  setupDbConnectionString(data) {
    return this.http.post(`${serverUrl}api/setup/db`, data);
  }
}
