import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import { User } from '@app/services/users/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import UserDataInterface, { UserDataPatchableInterface } from './user-data.interface';
import UserFilterOptions from '@app/services/users/user-filter-options.model';
import { Permissions } from '../policy/permissions.interface';
import { IAMPolicy } from '../policy/iam-policy.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {
  }

  // tslint:disable-next-line:variable-name
  patchOne(_id: string, userPatchableData: UserDataPatchableInterface): Observable<User> {
    return this.http.patch<User>(`api/users/${_id}`, userPatchableData)
      .pipe(
        map((user: User) => new User(user))
      );
  }

  private removeEmptyFields(userData: UserDataPatchableInterface): UserDataPatchableInterface {
    for (const key in userData) {
      if (userData.hasOwnProperty(key)) {
        if (!userData[key]) { // empty
          delete userData[key];
        }
      }
    }
    return userData;
  }


  private createFilterQuery(fields, options): HttpParams { // todo move to standalone file
    let params = new HttpParams();
    if (!options && !fields) {
      return params;
    }
    if (fields) {
      params = params.set('fields', JSON.stringify(fields));
    }
    return params.set('options', JSON.stringify(options));
  }

  getAllUsers(fields?: object, options?: UserFilterOptions) {
    const params = this.createFilterQuery(fields, options);
    return this.http.get<IEntityList<User>>('api/users', { params: params });
  }

  getUser(userId: string, fields?: object, filterOptions?: UserFilterOptions): Observable<User> {
    const params = this.createFilterQuery(fields, filterOptions);
    return this.http.get<User>(`api/users/${userId}`, { params: params });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`api/users/${userId}`);
  }

  updateUser(userId: string, userData: UserDataPatchableInterface): Observable<User> {
    userData = this.removeEmptyFields(userData);
    return this.http.patch<User>(`api/users/${userId}`, userData);
  }

  resetPassword(newPassword: string): Observable<User> {
    return this.http.post<User>(`api/users/reset-password`, { newPassword });
  }

  createUser(userData: UserDataInterface): Observable<User> {
    return this.http.post<User>('api/users', userData)
      .pipe(map((createdUser: User) => new User(createdUser)));
  }

  patchMany(userGroupsPatchableData: { [key: string]: UserDataPatchableInterface }): Observable<Array<User>> {
    return this.http.patch<Array<User>>(`api/users`, userGroupsPatchableData)
      .pipe(map((users: Array<User>) => users.map(user => new User(user))));
  }
}
