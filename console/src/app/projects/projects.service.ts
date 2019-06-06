import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Project } from './models/project.model';
import { Map } from '@maps/models/map.model';
import { MapStructure } from '@maps/models/map-structure.model';
import {FilterOptions} from '@shared/model/filter-options.model';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';
import {IEntityList} from '@shared/interfaces/entity-list.interface';

@Injectable()
export class ProjectsService {

  constructor(private http: HttpClient) {
  }

  archive(projectId, doArchive : boolean) {
    return this.http.put(`api/projects/${projectId}/archive`, {isArchive : doArchive});
  }

  create(project) {
    return this.http.post<Project>('api/projects/create', project);
  }

  detail(projectId) {
    return this.http.get<Project>(`api/projects/${projectId}/detail`);
  }

  filter(fields?: any,  options?:FilterOptions) {
    return this.http.post<IEntityList<Project>>(`api/projects`, { fields ,options});
  }

  filterRecentMaps(projectId:string){
    return this.http.get<DistinctMapResult[]>(`api/projects/${projectId}`);
  } 

  list(fields?: any, page?: number, options?:FilterOptions) {
    return this.http.post<IEntityList<Project>>('api/projects',{fields,page,options});
  }

  update(projectId, project) {
    return this.http.put<Project>('api/projects/' + projectId + '/update', project);
  }
  
  createMap(map) {
    return this.http.post<Map>('api/maps/create', map);
  }
  
  createMapStructure(mapId: string, structure: MapStructure) {
    return this.http.post<MapStructure>('api/maps/' + mapId + '/structure/create', structure);
  }
}
