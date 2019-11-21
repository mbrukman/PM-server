import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IAMPolicy } from './iam-policy.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  constructor(private http: HttpClient) { }

  updateIAMPolicy(iamPolicy: IAMPolicy): Observable<IAMPolicy> {
    return this.http.patch<IAMPolicy>(`api/iam-policies/${iamPolicy._id}`, iamPolicy);
  }
}
