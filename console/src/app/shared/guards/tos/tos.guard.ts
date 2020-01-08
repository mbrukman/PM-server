import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {TosService} from '@app/services/tos/tos.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TosGuard implements CanActivate {

  constructor(
    private router: Router,
    private tosService: TosService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.tosService.checkTos()
      .pipe(map((tosStatus: boolean) => {
        if (!tosStatus) {
          this.router.navigate(['tos']);
        }
        return tosStatus;
      }));
  }
}
