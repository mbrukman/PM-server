import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';

import {SettingsService} from '@app/services/settings/settings.service';

@Injectable()
export class IsSetUpGuard implements CanActivate {
  constructor(
    private settingsService: SettingsService,
    private router: Router
  ) {
  }

  canActivate(): boolean | Observable<boolean> {
    return this.isServerSetup();
  }

  isServerSetup(): Observable<boolean> | boolean {
    return this.settingsService.getSettings()
      .pipe(
        map(res => {
          if (!res.isSetup) {
            this.router.navigate(['/', 'setup']);
            return false;
          }
          return true;
        })
      );
  }
}
