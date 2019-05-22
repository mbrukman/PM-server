import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

import * as io from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

import { MapResult, Pending } from '@maps/models';
import { MapsService } from '@maps/maps.service'

@Injectable()
export class SocketService {
  socket: any;
  message: Subject<any> = new Subject<any>();
  notification: Subject<any> = new Subject<any>();
  executions: Subject<object> = new Subject<object>();
  mapExecution: Subject<MapResult> = new Subject<MapResult>();
  pending: Subject<Pending> = new Subject<Pending>();
  test: Pending;
  private _socketID: string;

  constructor(private mapsService: MapsService) {

    var socket = io(environment.serverUrl);

    socket.on('connect', function () {
      this._socketID = socket.id;
      mapsService.setSocketID(socket.id) 
    });

    this.socket = socket // TODO: why just var works?! 

    this.socketListener();
  }

  get getSocket() {
    return this.socket;
  }

  public get socketID(): string {
    return this._socketID;
  }


  socketListener() {
    this.socket.on('update', (data) => {
      this.setMessage(data);
    });

    this.socket.on('notification', (data) => {
      this.setNotification(data);
    });

    this.socket.on('saved-map', (data) => {
      if (data.savedMapSocket != this.mapsService.socketID) { // if another user or in another tab saved map 
        this.mapsService.checkSyncMap(data.mapId)
      }else{
        this.setNotification(data);
      }
    });

    this.socket.on('executions', (data: object) => {
      this.setCurrentExecutions(data);
    });

    this.socket.on('map-execution-result', (data) => {
      this.updateExecutionResult(data);
    });

    this.socket.on('pending', (data) => {
      this.updateCurrentPending(data);
    });
  }

  getMessagesAsObservable() {
    return this.message.asObservable();
  }

  setMessage(message) {
    this.message.next(message);
  }

  getNotificationAsObservable() {
    return this.notification.asObservable();
  }

  setNotification(message) {
    this.notification.next(message);
  }

  getCurrentExecutionsAsObservable() {
    return this.executions.asObservable();
  }

  setCurrentExecutions(data) {
    this.executions.next(data);
  }

  getMapExecutionResultAsObservable() {
    return this.mapExecution.asObservable();
  }

  updateExecutionResult(data) {
    this.mapExecution.next(data);
  }

  updateCurrentPending(data) {
    this.pending.next(data);
  }

  getCurrentPendingAsObservable(): Observable<Pending> {
    return this.pending.asObservable();
  }


}
