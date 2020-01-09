import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {TermsOfUseService} from '@app/services/terms-of-use/terms-of-use.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TermsOfUseGuard implements CanActivate {

  constructor(
    private router: Router,
    private tosService: TermsOfUseService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.tosService.checkTermsOfUse()
      .pipe(map((termsOfUseStatus: boolean) => {
        if (!termsOfUseStatus) {
          this.router.navigate(['terms-of-use']);
        }
        return termsOfUseStatus;
      }));
  }
}
