import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../environments/environment';
import {PluginSettings} from '@plugins/models/plugin-settings.model.ts'

import { Plugin } from './models/plugin.model';
import { PluginSettingsComponent } from './plugin-settings/plugin-settings.component';

const serverUrl = environment.serverUrl;

@Injectable()
export class PluginsService {

  constructor(private http: HttpClient) {
  }

  delete(id) {
    return this.http.delete(`${serverUrl}api/plugins/${id}/delete`);
  }

  list() {
    return this.http.get<Plugin[]>(`${serverUrl}api/plugins`).map(plugins=>{
      return plugins.map(plugin=> new Plugin(plugin));
    })
  }

  generatePluginMethodsParams(pluginId, methodName) {
    return this.http.get<PluginMethodParam[]>(`${serverUrl}api/plugins/${pluginId}/generateMethod/${methodName}`);
  }

  generatePluginSettingsParams(pluginId){
    return this.http.get<PluginSettings[]>(`${serverUrl}api/plugins/${pluginId}/generateSettings`);
  }

  upload(file): Observable<any> {
    return this.http.post(`${serverUrl}api/plugins/upload`, file);
  }

  updateSettings(pluginId,settings):Observable<any>{
    return this.http.post(`${serverUrl}api/plugins/${pluginId}/settings`, settings);
  }

  getById(pluginId){
    return this.http.get<Plugin>(`${serverUrl}api/plugins/${pluginId}`)
  }
  
}
