import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


class Settings {
  isSetup: boolean;
  version: string;
}

@Injectable({providedIn: 'root'})
export class SettingsService {
  public settings: Settings;
  configToken: string;

  constructor(private http: HttpClient) {
  }

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`api/settings`)
      .pipe(map(settings => {
        this.settings = settings;
        return settings;
      }));
  }

  setupDbConnectionString(data) {
    return this.http.post(`api/settings/db`, data);
  }
}
