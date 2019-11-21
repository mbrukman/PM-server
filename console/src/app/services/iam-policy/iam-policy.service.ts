import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import { IAMPolicy } from './iam-policy.interface';
import {Permissions} from '@app/services/iam-policy/permissions.interface';
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IAMPolicyService {

  public iamPolicySubject = new BehaviorSubject<Permissions>({} as Permissions);

  constructor(private http: HttpClient) {
  }

  updateIAMPolicy(iamPolicy: IAMPolicy): Observable<IAMPolicy> {
    return this.http.patch<IAMPolicy>(`api/iam-policies/${iamPolicy._id}`, iamPolicy)
      .pipe(tap(data => this.iamPolicySubject.next(data.permissions)));
  }
}
