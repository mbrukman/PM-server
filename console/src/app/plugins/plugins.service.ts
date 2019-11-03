import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Plugin } from '@plugins/models';
import { map } from 'rxjs/operators';


@Injectable({providedIn: 'root'})
export class PluginsService {

  constructor(private http: HttpClient) {
  }

  delete(id) {
    return this.http.delete(`api/plugins/${id}`);
  }

  list() {
    return this.http.get<Plugin[]>(`api/plugins`).pipe(
      map(plugins => {
      return plugins.map(plugin => new Plugin(plugin));
    }));
  }


  upload(file): Observable<any> {
    return this.http.post(`api/plugins/upload`, file);
  }

  updateSettings(pluginId, settings): Observable<any>{
    return this.http.post(`api/plugins/${pluginId}/settings`, settings);
  }

  getById(pluginId): Observable<any>{
    return this.http.get<Plugin>(`api/plugins/${pluginId}`);
  }

}
