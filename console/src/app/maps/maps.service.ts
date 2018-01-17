import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Map } from './models/map.model';
import { MapStructure } from './models/map-structure.model';
import { MapTrigger } from './models/map-trigger.model';
import { MapResult } from './models/execution-result.model';
import { MapExecutionLogs } from './models/map-logs.model';


const serverUrl = environment.serverUrl;

@Injectable()
export class MapsService {
  currentMap: BehaviorSubject<Map> = new BehaviorSubject<Map>(null);
  public currentMapStructure: BehaviorSubject<MapStructure> = new BehaviorSubject<MapStructure>(null);

  constructor(private http: HttpClient) {
  }

  allMaps(): Observable<[Map]> {
    return this.http.get<[Map]>(serverUrl + 'api/maps')
  }

  archive(mapId) {
    return this.http.get(`${serverUrl}api/maps/${mapId}/archive`);
  }

  clearCurrentMap() {
    this.currentMap.next(null);
  }

  createMap(map): Observable<Map> {
    return this.http.post<Map>(serverUrl + 'api/maps/create', map)
  }

  duplicateMap(mapId, structureId, projectId) {
    return this.http.post<Map>(`${serverUrl}api/maps/${mapId}/structure/${structureId}/duplicate`, { projectId: projectId })
  }

  getCurrentMap(): Observable<any> {
    return this.currentMap.asObservable();
  }

  getMap(id: string): Observable<Map> {
    return this.http.get<Map>(serverUrl + 'api/maps/' + id)
  }

  filterMaps(fields?: any, sort?: string, page?: number, globalFilter?: string) {
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
    return this.http.get<{ totalCount: number, items: Map[] }>(`${serverUrl}api/maps`, { params: params });
  }

  setCurrentMap(map: Map) {
    this.currentMap.next(map);
  }

  updateMap(mapId: string, map: Map) {
    return this.http.put<Map>(`${serverUrl}api/maps/${mapId}/update`, map, { responseType: 'text' as 'json' });
  }

  /* map execution */

  execute(mapId) {
    return this.http.get(serverUrl + 'api/maps/' + mapId + '/execute')
  }

  logsList(mapId: string, runId?: string) {
    return this.http.get<MapExecutionLogs[]>(serverUrl + 'api/maps/' + mapId + '/results/' + (runId ? runId + '/' : '') + 'logs')
  }

  executionResultDetail(mapId, resultId) {
    return this.http.get<MapResult>(`${serverUrl}api/maps/${mapId}/results/${resultId}`);
  }

  executionResults(mapId) {
    return this.http.get<MapResult[]>(`${serverUrl}api/maps/${mapId}/results`);
  }

  /* map structure */

  createMapStructure(mapId: string, structure: MapStructure) {
    return this.http.post<MapStructure>(serverUrl + 'api/maps/' + mapId + '/structure/create', structure)
  }

  clearCurrentMapStructure() {
    this.currentMapStructure.next(null);
  }

  getMapStructure(mapId, structureId = '') {
    return this.http.get<MapStructure>(serverUrl + 'api/maps/' + mapId + '/structure/' + structureId)
  }

  getCurrentMapStructure(): Observable<MapStructure> {
    return this.currentMapStructure.asObservable();
  }

  setCurrentMapStructure(structure: MapStructure) {
    this.currentMapStructure.next(structure);
  }

  structuresList(mapId) {
    return this.http.get<MapStructure[]>(`${serverUrl}api/maps/${mapId}/structures`)
  }

  /* map triggers */

  createTrigger(mapId, trigger) {
    return this.http.post<MapTrigger>(serverUrl + 'api/maps/' + mapId + '/triggers/create', trigger);
  }

  deleteTrigger(mapId, triggerId) {
    const options = { responseType: 'text' as 'json' };
    return this.http.delete<any>(serverUrl + 'api/maps/' + mapId + '/triggers/' + triggerId + '/delete', options);
  }

  triggersList(mapId) {
    return this.http.get<MapTrigger[]>(serverUrl + 'api/maps/' + mapId + '/triggers')
  }

  updateTrigger(mapId, trigger) {
    return this.http.put<MapTrigger>(serverUrl + 'api/maps/' + mapId + '/triggers/' + trigger._id + '/update', trigger);
  }

}
