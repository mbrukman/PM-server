import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';
import UserGroup from '@app/services/user-group/user-group.model';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {FilterOptions} from '@app/shared/model/filter-options.model';
import {IEntityList} from '@app/shared/interfaces/entity-list.interface';


@Injectable({providedIn: 'root'})
export class UserGroupService {

  constructor(private http: HttpClient) {
  }

  deleteUserGroup(id: string): Observable<UserGroup> {
    return this.http.delete<UserGroup>(`api/user-groups/${id}`);
  }


  createUserGroup(userGroupData: UserGroupDataInterface): Observable<UserGroup> {
    return this.http.post<UserGroup>('api/user-groups', userGroupData)
      .pipe(map((userGroup: UserGroup) => new UserGroup(userGroup._id, userGroup.name, userGroup.description, userGroup.users)));
  }

  getAllGroups(fields?: object, options?: FilterOptions): Observable<IEntityList<UserGroup>> {
    let params = new HttpParams();
    if (fields) {
      params = params.set('fields', JSON.stringify(fields));
    }
    params = params.set('options', JSON.stringify(options));
    return this.http.get<IEntityList<UserGroup>>('api/user-groups', {params: params});
  }
}
