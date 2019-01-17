import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';

import { SettingsService } from './setup.service';

@Injectable()
export class IsSetUpGuard implements CanActivate {
  constructor(private settingsService: SettingsService, private router: Router) {
  }

  canActivate(): boolean | Observable<boolean> {
    return this.isServerSetup();
  }

  isServerSetup(): Observable<boolean> | boolean {
    return this.settingsService.getSettings().map(res=>{
      console.log(res);
      
      if (!res.isSetup) {
        this.router.navigate(['/', 'setup']);
        return false;
      }
      return true;
    })
}
