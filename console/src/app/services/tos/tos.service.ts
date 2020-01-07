import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map, switchMap} from 'rxjs/operators';
import {TosModel} from '@app/services/tos/tos.model';

@Injectable({
  providedIn: 'root'
})
export class TosService {

  constructor(private http: HttpClient) {
  }

  checkTos(): Observable<boolean> {
    return this.http.get<TosModel>('api/tos')
      .pipe(
        map(tosData => new TosModel(tosData)),
        map(tosData => tosData.isAccepted)
      );
  }

  updateTos(isAccepted: boolean): Observable<Boolean> {
    return this.http.post<TosModel>('api/tos', {isAccepted})
      .pipe(
        switchMap(() => this.checkTos())
      );
  }
}

