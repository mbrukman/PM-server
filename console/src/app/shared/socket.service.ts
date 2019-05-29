import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

import * as io from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

import { MapResult, Pending } from '@maps/models';

@Injectable()
export class SocketService {
  socket: any;
  logExecution: Subject<any> = new Subject<any>();
  notification: Subject<any> = new Subject<any>();
  message: Subject<any> = new Subject<any>();
  executions: Subject<object> = new Subject<object>();
  mapExecution: Subject<MapResult> = new Subject<MapResult>();
  mapResult: Subject<any> = new Subject<MapResult>();
  pending: Subject<Pending> = new Subject<Pending>();
  test: Pending;
  socketID: string;

  constructor() {

    this.socket = io(environment.serverUrl);
    let self = this
    this.socket.on('connect', function () {
      self.socketID = this.id;
    });

    this.socketListener();
  }

  get getSocket() {
    return this.socket;
  }



  socketListener() {
    this.socket.on('update', (data) => {
      this.setLegExecution(data);
    });

    this.socket.on('notification', (data) => {
      this.setNotification(data);
    });

    this.socket.on()

    this.socket.on('message', (data) => {
      this.message.next(data);
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

  joinRoom(id){
    this.socket.emit('execution-update',id)
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

  setMapExecutionResult(data){
    this.mapResult.next(data)
  }

  getMapExecutionResult(){
    return this.mapResult.asObservable()
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
