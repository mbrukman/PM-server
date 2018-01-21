import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

import * as io from 'socket.io-client';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SocketService {
  socket: any;
  message: Subject<any> = new Subject<any>();
  notification: Subject<any> = new Subject<any>();

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

}
