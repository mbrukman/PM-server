import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import { User } from './user.model';
import { FilterOptions } from '@app/shared/model/filter-options.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import UserDataInterface from './user-data.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) { }

  getAllUsers(fields?: object, options?: FilterOptions) {
    let params = new HttpParams();
    if (fields){
      params = params.set('fields', JSON.stringify(fields));
    }
    params = params.set('options', JSON.stringify(options));
    return this.http.get<IEntityList<User>>('api/users', { params: params });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`api/users/${userId}`);
  }

  createUser(userData: UserDataInterface): Observable<User> {
    return this.http.post<User>('api/users', userData)
      .pipe(map((createdUser: User) => new User(createdUser)));
  }
}
