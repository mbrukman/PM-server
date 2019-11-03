import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import { User } from './user.model';
import { FilterOptions } from '@app/shared/model/filter-options.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) { }

  getAllUsers(fields?: object, options?: FilterOptions) {
    return this.http.post<IEntityList<User>>(`api/users/filter`, { fields, options });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`api/users/${userId}`);
  }
}
