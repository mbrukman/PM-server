import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
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

  upload(file): Observable<any> {
    return this.http.post(serverUrl + "api/plugins/upload", file)
  }
}
