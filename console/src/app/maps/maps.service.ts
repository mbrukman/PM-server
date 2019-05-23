import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { DistinctMapResult } from '@shared/model/distinct-map-result.model';
import { Map, MapExecutionLogs, MapResult, MapStructure, MapTrigger } from './models';
import { FilterOptions } from '@shared/model/filter-options.model'
import { MapDuplicateOptions } from './models/map-duplicate-options.model'
import { SettingsService } from '@core/setup/settings.service';
import { IEntityList } from '@shared/interfaces/entity-list.interface';
import { PopupService } from '@shared/services/popup.service';
import { SocketService } from '@app/shared/socket.service';

@Injectable()
export class MapsService {
  currentMap: BehaviorSubject<Map> = new BehaviorSubject<Map>(null);
  currentMapId: string
  public currentMapStructure: BehaviorSubject<MapStructure> = new BehaviorSubject<MapStructure>(null);
  mapChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(private http: HttpClient, private settingsService: SettingsService, private popupService: PopupService, private socketService: SocketService) {
    this.init()
  }

  init() {
    this.socketService.getMessageAsObservable().subscribe(data => {
      if (data.type != 'saved-map') { return }
      if (data.msg.savedMapSocket != this.socketService.socketID) { // if another user or in another tab map was saved 
        this.checkSyncMap(data.msg.mapId)
      } else {
        this.socketService.setNotification(data.msg);
      }
    })
  }


  checkSyncMap(mapId) {
    let OK = 'Confirm'
    if (this.currentMapId == mapId) {
      this.popupService.openConfirm(null, 'The same map was saved in different window. Do you want to refresh window and get the latest map?', OK, null, null).subscribe(result => {
        if (OK == result) {
          location.reload();
        } else {
          this.mapChanged.next(true)
        }
      })
    }
  }

  isMapChanged() {
    return this.mapChanged.asObservable()
  }

  recentMaps() {
    return this.http.get<DistinctMapResult[]>(`api/maps/recent`);
  }
  allMaps(): Observable<[Map]> {
    return this.http.get<[Map]>(`api/maps`);
  }

  archive(mapId: string, isArchive: boolean) {
    let body = { isArchive: isArchive }
    return this.http.put(`api/maps/${mapId}/archive`, body);
  }

  clearCurrentMap() {
    this.currentMapId = null
    this.currentMap.next(null);
  }

  createMap(map): Observable<Map> {
    return this.http.post<Map>(`api/maps/create`, map);
  }

  duplicateMap(mapId, structureId, projectId, options: MapDuplicateOptions) {
    return this.http.post<Map>(`api/maps/${mapId}/structure/${structureId}/duplicate`, { projectId: projectId, options });
  }

  getCurrentMap(): Observable<any> {
    return this.currentMap.asObservable();
  }

  getMap(id: string): Observable<Map> {
    return this.http.get<Map>(`api/maps/${id}`);
  }

  filterMaps(fields?: any, page?: number, options?: FilterOptions) {
    return this.http.post<IEntityList<Map>>(`api/maps`, { page, fields, options });
  }

  delete(id) {
    return this.http.delete(`api/maps/${id}`);
  }

  setCurrentMap(map: Map) {
    this.currentMapId = map.id || map._id
    this.currentMap.next(map);
  }

  updateMap(mapId: string, map: Map) {
    return this.http.put<string>(`api/maps/${mapId}/update`, map, { responseType: 'text' as 'json' });
  }

  /* map execution */

  cancelPending(mapId: string, runId: string) {
    return this.http.post(`api/maps/${mapId}/cancel-pending`, { runId });
  }

  execute(mapId: string, config?: string) {
    let data: any = { trigger: 'Started manually by user' };
    if (config) {
      data.config = config;
    }
    if (this.settingsService.configToken) {
      data.configToken = this.settingsService.configToken
    }
    return this.http.post(`api/maps/${mapId}/execute`, data);
  }

  stopExecutions(mapId: string, runId = '') {
    return this.http.get(`api/maps/${mapId}/stop-execution/${runId}`);
  }

  getDistinctMapExecutionsResult() {
    return this.http.get<DistinctMapResult[]>(`api/maps/results`);
  }

  logsList(mapId: string, runId?: string) {
    return this.http.get<MapExecutionLogs[]>(`api/maps/${mapId}/results/${runId ? runId + '/' : ''}logs`);
  }

  currentExecutionList() {
    return this.http.get(`api/maps/currentruns`);
  }

  executionResultDetail(mapId, resultId) {
    return this.http.get<MapResult>(`api/maps/${mapId}/results/${resultId}`);
  }

  executionResults(mapId, page) {
    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    return this.http.get<MapResult[]>(`api/maps/${mapId}/results`, { params: params });
  }

  /* map structure */

  createMapStructure(mapId: string, structure: MapStructure) {
    let data = { structure, socketId: this.socketService.socketID }
    return this.http.post<MapStructure>(`api/maps/${mapId}/structure/create`, data);
  }

  clearCurrentMapStructure() {
    this.currentMapStructure.next(null);
  }

  getMapStructure(mapId, structureId = '') {
    return this.http.get<MapStructure>(`api/maps/${mapId}/structure/${structureId}`);
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
    return this.http.get<MapStructure[]>(`api/maps/${mapId}/structures`, { params: params });
  }

  /* map triggers */
  createTrigger(mapId, trigger) {
    return this.http.post<MapTrigger>(`api/triggers/${mapId}`, trigger);
  }

  deleteTrigger(mapId, triggerId) {
    const options = { responseType: 'text' as 'json' };
    return this.http.delete<any>(`api/triggers/${mapId}/${triggerId}`, options);
  }

  triggersList(mapId) {
    return this.http.get<MapTrigger[]>(`api/triggers/${mapId}`);
  }

  updateTrigger(mapId, trigger) {
    return this.http.put<MapTrigger>(`api/triggers/${mapId}/${trigger._id}`, trigger);
  }

}
