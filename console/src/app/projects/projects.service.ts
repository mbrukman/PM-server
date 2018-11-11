import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Project } from './models/project.model';
import { Map } from '@maps/models/map.model';
import { MapStructure } from '@maps/models/map-structure.model';


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

  detail(projectId) {
    return this.http.get<Project>(serverUrl + 'api/projects/' + projectId);
  }

  filter(fields?: any, sort?: string, page?: number, globalFilter?: string) {
    let params = new HttpParams();
    if (fields) {
      Object.keys(fields).map(key => {
        params = params.set(`fields[${key}]`, fields[key]);
      });
    }
    if (sort) {
      params = params.set('sort', sort);
    }
    if (page) {
      params = params.set('page', page.toString());
    }
    if (globalFilter) {
      params = params.set('globalFilter', globalFilter);
    }
    return this.http.get<{ totalCount: number, items: Project[] }>(`${serverUrl}api/projects`, { params: params });
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
