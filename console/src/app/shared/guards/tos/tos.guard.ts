import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {TosService} from '@app/services/tos/tos.service';

@Injectable({
  providedIn: 'root'
})
export class TosGuard implements CanActivate {

  constructor(private tosService: TosService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.tosService.checkTos();
  }
}
