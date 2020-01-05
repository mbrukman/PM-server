import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


class Settings {
  isSetup: boolean;
  version: string;
}

@Injectable()
export class SettingsService {
  public settings: Settings;
  configToken: string;

  constructor(private http: HttpClient) {
  }

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`api/settings`).map(settings => {
      this.settings = settings;
      return settings;
    });
  }

  setupDbConnectionString(data) {
    return this.http.post(`api/settings/db`, data);
  }
}
