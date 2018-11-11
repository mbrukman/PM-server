import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Map, MapExecutionLogs, MapResult, MapStructure, MapTrigger } from './models';


const serverUrl = environment.serverUrl;

@Injectable()
export class MapsService {
  currentMap: BehaviorSubject<Map> = new BehaviorSubject<Map>(null);
  public currentMapStructure: BehaviorSubject<MapStructure> = new BehaviorSubject<MapStructure>(null);

  constructor(private http: HttpClient) {
  }

  allMaps(): Observable<[Map]> {
    return this.http.get<[Map]>(`${serverUrl}api/maps`);
  }

  archive(mapId) {
    return this.http.get(`${serverUrl}api/maps/${mapId}/archive`);
  }

  clearCurrentMap() {
    this.currentMap.next(null);
  }

  createMap(map): Observable<Map> {
    return this.http.post<Map>(`${serverUrl}api/maps/create`, map);
  }

  duplicateMap(mapId, structureId, projectId) {
    return this.http.post<Map>(`${serverUrl}api/maps/${mapId}/structure/${structureId}/duplicate`, { projectId: projectId });
  }

  getCurrentMap(): Observable<any> {
    return this.currentMap.asObservable();
  }

  getMap(id: string): Observable<Map> {
    return this.http.get<Map>(`${serverUrl}api/maps/${id}`);
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
    return this.http.get<{ items: Map[],totalCount: number}>(`${serverUrl}api/maps`, { params: params });
  }

  delete(id) {
    return this.http.delete(`${serverUrl}api/maps/${id}`);
  }

  


  setCurrentMap(map: Map) {
    this.currentMap.next(map);
  }

  updateMap(mapId: string, map: Map) {
    return this.http.put<string>(`${serverUrl}api/maps/${mapId}/update`, map, { responseType: 'text' as 'json' });
  }

  /* map execution */

  cancelPending(mapId: string, runId: string) {
    return this.http.post(`${serverUrl}api/maps/${mapId}/cancel-pending`, { runId });
  }

  execute(mapId: string, config?: string) {
    let data: any = { trigger: 'Started manually by user' };
    if (config) {
      data.config = config;
    }
    return this.http.post(`${serverUrl}api/maps/${mapId}/execute`, data);
  }

  stopExecutions(mapId: string, runId = '') {
    return this.http.get(`${serverUrl}api/maps/${mapId}/stop-execution/${runId}`);
  }

  getDistinctMapExecutionsResult() {
    return this.http.get<any>(`${serverUrl}api/maps/results`);
  }

  logsList(mapId: string, runId?: string) {
    return this.http.get<MapExecutionLogs[]>(`${serverUrl}api/maps/${mapId}/results/${runId ? runId + '/' : ''}logs`);
  }

  currentExecutionList() {
    return this.http.get(`${serverUrl}api/maps/currentruns`);
  }

  executionResultDetail(mapId, resultId) {
    return this.http.get<MapResult>(`${serverUrl}api/maps/${mapId}/results/${resultId}`);
  }

  executionResults(mapId) {
    return this.http.get<MapResult[]>(`${serverUrl}api/maps/${mapId}/results`);
  }

  /* map structure */

  createMapStructure(mapId: string, structure: MapStructure) {
    return this.http.post<MapStructure>(`${serverUrl}api/maps/${mapId}/structure/create`, structure);
  }

  clearCurrentMapStructure() {
    this.currentMapStructure.next(null);
  }

  getMapStructure(mapId, structureId = '') {
    return this.http.get<MapStructure>(`${serverUrl}api/maps/${mapId}/structure/${structureId}`);
  }

  getCurrentMapStructure(): Observable<MapStructure> {
    return this.currentMapStructure.asObservable();
  }

  setCurrentMapStructure(structure: MapStructure) {
    this.currentMapStructure.next(structure);
  }

  structuresList(mapId, page?) {
    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    return this.http.get<MapStructure[]>(`${serverUrl}api/maps/${mapId}/structures`, { params: params });
  }

  /* map triggers */
  createTrigger(mapId, trigger) {
    return this.http.post<MapTrigger>(`${serverUrl}api/maps/${mapId}/triggers/create`, trigger);
  }

  deleteTrigger(mapId, triggerId) {
    const options = { responseType: 'text' as 'json' };
    return this.http.delete<any>(`${serverUrl}api/maps/${mapId}/triggers/${triggerId}/delete`, options);
  }

  triggersList(mapId) {
    return this.http.get<MapTrigger[]>(`${serverUrl}api/maps/${mapId}/triggers`);
  }

  updateTrigger(mapId, trigger) {
    return this.http.put<MapTrigger>(`${serverUrl}api/maps/${mapId}/triggers/${trigger._id}/update`, trigger);
  }

}
