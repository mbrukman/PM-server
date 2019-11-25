import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  UserGroupDataInterface,
  UserGroupPatchableDataInterface
} from '@app/services/user-group/user-group-data.interface';
import UserGroup from '@app/services/user-group/user-group.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FilterOptions } from '@app/shared/model/filter-options.model';
import { IEntityList } from '@app/shared/interfaces/entity-list.interface';
import RemoveResponseInterface from '@shared/interfaces/remove-response.interface';

@Injectable({ providedIn: 'root' })
export class UserGroupService {

  constructor(private http: HttpClient) {
  }

  deleteUserGroup(id: string): Observable<RemoveResponseInterface> {
    return this.http.delete<RemoveResponseInterface>(`api/user-groups/${id}`);
  }

  private createFilterQuery(fields, options): HttpParams {
    let params = new HttpParams();
    if (!options && !fields) {
      return params;
    }
    if (fields) {
      params = params.set('fields', JSON.stringify(fields));
    }
    return params.set('options', JSON.stringify(options));
  }

  getOne(id: string, filter?: FilterOptions) {
    const params = this.createFilterQuery(null, filter);
    return this.http.get<UserGroup>(`api/user-groups/${id}`, { params })
      .pipe(map(userGroup => new UserGroup(userGroup)));
  }

  patchMany(userGroupsPatchableData: { [key: string]: UserGroupPatchableDataInterface }): Observable<Array<UserGroup>> {
    return this.http.patch<Array<UserGroup>>(`api/user-groups`, userGroupsPatchableData)
      .pipe(map((userGroups: Array<UserGroup>) => userGroups.map(userGroup => new UserGroup(userGroup))));
  }

  // tslint:disable-next-line:variable-name
  patchOne(_id: string, userGroupPatchableData: UserGroupPatchableDataInterface): Observable<UserGroup> {
    return this.http.patch<UserGroup>(`api/user-groups/${_id}`, userGroupPatchableData)
      .pipe(
        map((userGroup: UserGroup) => new UserGroup(userGroup))
      );
  }


  createUserGroup(userGroupData: UserGroupDataInterface): Observable<UserGroup> {
    return this.http.post<UserGroup>('api/user-groups', userGroupData)
      .pipe(map((userGroup: UserGroup) => new UserGroup(userGroup)));
  }

  getAllGroups(fields?: object, options?: FilterOptions): Observable<IEntityList<UserGroup>> {
    const params = this.createFilterQuery(fields, options);
    return this.http.get<IEntityList<UserGroup>>('api/user-groups', { params });
  }
}
