import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { TermsOfUseModel } from '@app/services/terms-of-use/terms-of-use.model';

@Injectable({
  providedIn: 'root'
})
export class TermsOfUseService {

  constructor(private http: HttpClient) {
  }

  checkTermsOfUse(): Observable<boolean> {
    return this.http.get<TermsOfUseModel>('api/terms-of-use')
      .pipe(
        map(tosData => new TermsOfUseModel(tosData)),
        map(tosData => tosData.isAccepted)
      );
  }

  updateAndCheckTermsOfUse(): Observable<boolean> {
    return this.http.post<TermsOfUseModel>('api/terms-of-use', {isAccepted: true})
      .pipe(
        map(tosData => new TermsOfUseModel(tosData)),
        map(tosData => tosData.isAccepted)
      );
  }
}

