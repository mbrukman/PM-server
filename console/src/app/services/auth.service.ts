import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './users/user.model';
import { tap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {
  }

  static get token(): string {
    return localStorage.getItem('access_token');
  }

  static get resetPasswordUnfulfilled(): string {
    return localStorage.getItem('resetPasswordUnfulfilled');
  }

  public login(email: string, password: string, keepLoggedIn: boolean): Observable<User> {
    return this.http.post<User>(`api/auth/login`, { email, password, keepLoggedIn }, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<User>) => {
          const authorizationHeaderValue = response.headers.get('Authorization');
          if (!authorizationHeaderValue) {
            throw new Error('No Authorization header in server login response.');
          }
          this.saveToken(authorizationHeaderValue);
        }),
        map(response => response.body as User)
      );
  }

  public logout() {
    localStorage.removeItem('access_token');
  }

  private saveToken(authorizationHeaderValue: string) {
    const token = authorizationHeaderValue.split(' ')[1];
    localStorage.setItem('access_token', token);
  }
}
