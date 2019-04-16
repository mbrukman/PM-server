import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Project } from './models/project.model';
import { Map } from '@maps/models/map.model';
import { MapStructure } from '@maps/models/map-structure.model';
import {FilterOptions} from '@shared/model/filter-options.model';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import {IEntityList} from '@shared/interfaces/entity-list.interface';
const serverUrl = environment.serverUrl;

@Injectable()
export class ProjectsService {

  constructor(private http: HttpClient) {
  }

  archive(projectId, doArchive : boolean) {
    return this.http.put(`${serverUrl}api/projects/${projectId}/archive`, {isArchive : doArchive});
  }

  create(project) {
    return this.http.post<Project>(serverUrl + 'api/projects/create', project);
  }

  detail(projectId,fields=null,page=1,options?:FilterOptions) {
    return this.http.post<Project>(serverUrl + 'api/projects/' + projectId ,{fields,page,options});
  }

  filter(fields?: any, page?: number, options?:FilterOptions) {
    return this.http.post<IEntityList<Project>>(`${serverUrl}api/projects`, { page, fields ,options});
  }

  filterRecentMaps(projectId:string){
    return this.http.get<DistinctMapResult[]>(`${serverUrl}api/projects/${projectId}`);
  }

  list(fields?: any, page?: number, options?:FilterOptions) {
    return this.http.post<IEntityList<Project>>(serverUrl + 'api/projects',{fields,page,options});
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
