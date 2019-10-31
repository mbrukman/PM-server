import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import { User } from './models/user.model';
import { FilterOptions } from '@app/shared/model/filter-options.model';

@Injectable({
  providedIn: 'root'
})
export class UsersManagementService {
  constructor(private http: HttpClient) {}

  getAllUsers(fields?: any,  options?: FilterOptions){
    return this.http.post<IEntityList<User>>(`api/users/`, { fields, options });
  }
}
