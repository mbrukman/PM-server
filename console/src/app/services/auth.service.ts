import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './users/user.model';
import { switchMap, tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {
  }

  static get token(): string {
    return localStorage.getItem('access_token');
  }

  private saveToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  public login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`api/users/authenticate`, { email, password }, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<User>) => {
          this.saveToken(response.headers.get('authorization'));
        }),
        map(response => response.body as User)
      );
  }

  logout() {
    localStorage.removeItem('access_token');
  }
}
