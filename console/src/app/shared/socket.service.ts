import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

import * as io from 'socket.io-client';
import { Subject } from 'rxjs/Subject';

import { MapResult } from '../maps/models/execution-result.model';

@Injectable()
export class SocketService {
  socket: any;
  message: Subject<any> = new Subject<any>();
  notification: Subject<any> = new Subject<any>();
  executions: Subject<object> = new Subject<object>();
  mapExecution: Subject<MapResult> = new Subject<MapResult>();

  constructor() {
    this.socket = io(environment.serverUrl);
    this.socketListener();
  }

  get getSocket() {
    return this.socket;
  }

  socketListener() {
    this.socket.on('update', (data) => {
      this.setMessage(data);
    });

    this.socket.on('notification', (data) => {
      this.setNotification(data);
    });

    this.socket.on('executions', (data: object) => {
      this.setCurrentExecutions(data);
    });

    this.socket.on('map-execution-result', (data) => {
      this.updateExecutionResult(data);
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



}
