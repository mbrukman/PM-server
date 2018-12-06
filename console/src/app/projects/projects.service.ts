import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Project } from './models/project.model';
import { Map } from '@maps/models/map.model';
import { MapStructure } from '@maps/models/map-structure.model';
import {FilterOptions} from '@shared/model/filter-options.model'

const serverUrl = environment.serverUrl;

@Injectable()
export class ProjectsService {

  constructor(private http: HttpClient) {
  }

  archive(projectId) {
    return this.http.get(`${serverUrl}api/projects/${projectId}/archive`);
  }

  create(project) {
    return this.http.post<Project>(serverUrl + 'api/projects/create', project);
  }

  detail(projectId,options?:FilterOptions) {
    return this.http.post<Project>(serverUrl + 'api/projects/' + projectId,options);
  }

  filter(fields?: any, sort?: string, page?: number, options?:FilterOptions) {
    return this.http.post<{ totalCount: number, items: Project[] }>(`${serverUrl}api/projects`, { page, fields, sort ,options});
  }

  list() {
    return this.http.get<{ totalCount: number, items: Project[] }>(serverUrl + 'api/projects');
  }

  update(projectId, project) {
    return this.http.put<Project>(serverUrl + 'api/projects/' + projectId + '/update', project);
  }
  
  createMap(map) {
    return this.http.post<Map>(serverUrl + 'api/maps/create', map);
  }

  createMapStructure(mapId: string, structure: MapStructure) {
    return this.http.post<MapStructure>(serverUrl + 'api/maps/' + mapId + '/structure/create', structure);
  }
}
