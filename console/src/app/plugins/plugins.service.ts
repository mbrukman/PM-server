import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { PluginMethodParam } from '@plugins/models/plugin-method-param.model';
import { environment } from "../../environments/environment";

import { Plugin } from "./models/plugin.model";
import { Observable } from "rxjs/Observable";


const serverUrl = environment.serverUrl;

@Injectable()
export class PluginsService {

  constructor(private http: HttpClient) {
  }

  delete(id) {
    return this.http.delete(serverUrl+ "api/plugins/" + id + "/delete")
  }

  list() {
    return this.http.get<[Plugin]>(serverUrl + "api/plugins")
  }

  generatePluginParams(pluginId, methodName) {
    return this.http.get<PluginMethodParam[]>(`${serverUrl}api/plugins/${pluginId}/generate/${methodName}`);
  }

  upload(file): Observable<any> {
    return this.http.post(serverUrl + "api/plugins/upload", file)
  }
}
