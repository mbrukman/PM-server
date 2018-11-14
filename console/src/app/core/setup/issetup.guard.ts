import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';

import { SetupService } from './setup.service';

@Injectable()
export class IsSetUpGuard implements CanActivate {
  constructor(private setupService: SetupService, private router: Router) {
  }

  canActivate(): boolean | Observable<boolean> {
    return this.isServerSetup();
  }

  isServerSetup(): Observable<boolean> | boolean {
    return this.setupService.isSetup()
      .take(1)
      .map(isSetup => {
        if (!isSetup) {
          this.router.navigate(['/', 'setup']);
        }
        this.setupService.setup = isSetup;
        return isSetup;
      });
  }

}
