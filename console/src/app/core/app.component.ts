import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import 'rxjs/operators/filter';
import { ToastOptions, ToastyConfig, ToastyService } from 'ng2-toasty';

import { SocketService } from '../shared/socket.service';
import { SetupService } from '@core/setup/setup.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app';
  search: boolean = false;
  notificationSubscription: Subscription;

  constructor(private router: Router,
              private socketService: SocketService,
              public setupService: SetupService,
              private toastyService: ToastyService,
              private toastyConfig: ToastyConfig) {
    this.toastyConfig.theme = 'material';
    this.toastyConfig.position = 'bottom-center';
  }

  ngOnInit() {
    this.notificationSubscription = this.socketService.getNotificationAsObservable().subscribe(notification => {
      const toastOptions: ToastOptions = {
        title: notification.title,
        msg: notification.message,
        showClose: true,
        timeout: 5000
      };
      switch (notification.type) {
        case 'default':
          return this.toastyService.default(toastOptions);
        case 'info':
          return this.toastyService.info(toastOptions);
        case 'success':
          return this.toastyService.success(toastOptions);
        case 'wait':
          return this.toastyService.wait(toastOptions);
        case 'error':
          return this.toastyService.error(toastOptions);
        case 'warning':
          return this.toastyService.warning(toastOptions);
      }
    });
  }

  toggleSearch() {
    this.search = !this.search;
  }


}
