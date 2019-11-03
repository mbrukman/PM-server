import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import { User } from './models/user.model';
import { FilterOptions } from '@app/shared/model/filter-options.model';


@Injectable({
  providedIn: 'root'
})
export class UsersManagementService {
  constructor(private http: HttpClient) { }

  getAllUsers(fields?: object, options?: FilterOptions) {
    let params = new HttpParams();
    if (fields){
      params = params.set('fields', JSON.stringify(fields));
    }
    params = params.set('options', JSON.stringify(options));
    return this.http.get<IEntityList<User>>(`api/users/filter`, { params: params });
  }
}
