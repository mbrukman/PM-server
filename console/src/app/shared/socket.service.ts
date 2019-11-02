import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

import * as io from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

import { Pending } from '@maps/models';
import {MapResult} from '@app/services/map/models/execution-result.model';

@Injectable({providedIn: 'root'})
export class SocketService {
  socket: any;
  socketNamespaces: object = {};
  logExecution: Subject<any> = new Subject<any>();
  notification: Subject<any> = new Subject<any>();
  message: Subject<any> = new Subject<any>();
  executions: Subject<object> = new Subject<object>();
  mapExecution: Subject<MapResult> = new Subject<MapResult>();
  pending: Subject<Pending> = new Subject<Pending>();
  test: Pending;
  socketID: string;

  constructor() {
    this.socket = io(environment.serverUrl);
    this.socketNamespaces['/'] = this.socket;
    let self = this
    this.socket.on('connect', function () {
      self.socketID = this.id;
    });
    this.socketListener(this.socket);
  }

  get getSocket() {
    return this.socket;
  }

  addNewSocket(namespace : string){
    if (this.socketNamespaces[namespace])
      return this.socketNamespaces[namespace]
    let socket = io(environment.serverUrl+namespace);
    this.socketNamespaces['/'+namespace] = socket;
    return socket;
  }

  closeSocket(namespace:string){
    if(this.socketNamespaces[namespace]){
      this.socketNamespaces[namespace].close();
      delete this.socketNamespaces[namespace];
    }
  }

  socketListener(socket) {
    socket.on('update', (data) => {
      this.setLegExecution(data);
    });

    socket.on('notification', (data) => {
      this.setNotification(data);
    });

    socket.on('message', (data) => {
      this.message.next(data);
    });

    socket.on('executions', (data: object) => {
      this.setCurrentExecutions(data);
    });

    socket.on('map-execution-result', (data) => {
      this.updateExecutionResult(data);
    });

    socket.on('pending', (data) => {
      this.updateCurrentPending(data);
    });

  }

  getLogExecutionAsObservable() {
    return this.logExecution.asObservable();
  }

  setLegExecution(message) {
    this.logExecution.next(message);
  }
  getMessageAsObservable() {
    return this.message.asObservable();
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
