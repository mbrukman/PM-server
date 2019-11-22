import {Injectable} from '@angular/core';
import {CanDeactivate, Router} from '@angular/router';
import {IAMPolicyService} from '@app/services/iam-policy/iam-policy.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';


@Injectable()
export class IAMPolicyGuard implements CanDeactivate<Observable<Boolean>> {
  constructor(private iamPolicyService: IAMPolicyService, private router: Router) {
  }

  canDeactivate() {
    return this.iamPolicyService
      .iamPolicySubject
      .pipe(
        map(permissions => permissions && permissions.read)
      );
  }
}
