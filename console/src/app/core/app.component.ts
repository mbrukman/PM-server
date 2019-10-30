import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Subscription} from 'rxjs';
import {ToastOptions, ToastyConfig, ToastyService} from 'ng2-toasty';

import {SocketService} from '../shared/socket.service';
import {MapsService} from '@app/services/map/maps.service';
import {Map} from '@app/services/map/models/map.model';
import {ActivatedRoute} from '@angular/router';
import {SettingsService} from '@app/services/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app';
  search: boolean = false;
  currentMap: Map;

  private mainSubscription = new Subscription();

  constructor(
    private mapsService: MapsService,
    private router: Router,
    private socketService: SocketService,
    public settingsService: SettingsService,
    private toastyService: ToastyService,
    private toastyConfig: ToastyConfig,
    private route: ActivatedRoute
  ) {
    this.toastyConfig.theme = 'material';
    this.toastyConfig.position = 'bottom-center';
  }

  ngOnInit() {
    const queryParamsSubscription = this.route.queryParams.subscribe((param) => {
      if (param.configToken) {
        this.settingsService.configToken = param.configToken;
      }
    });

    const currentMapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      this.currentMap = map;
    });

    const notificationSubscription = this.socketService.getNotificationAsObservable().subscribe(notification => {
      if (notification.mapId) {

        if ((this.currentMap) && (this.currentMap.id === notification.mapId)) {
          this.showMessage(notification);
        }
      } else {
        this.showMessage(notification);
      }
    });

    this.mainSubscription.add(queryParamsSubscription);
    this.mainSubscription.add(currentMapSubscription);
    this.mainSubscription.add(notificationSubscription);
  }


  showMessage(notification) {
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
  }

  toggleSearch() {
    this.search = !this.search;
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
