import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';
import UserGroup from '@app/services/user-group/user-group.model';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Injectable({providedIn: 'root'})
export class UserGroupService {

  constructor(private http: HttpClient) {
  }

  createUserGroup(userGroupData: UserGroupDataInterface): Observable<UserGroup> {
    return this.http.post<UserGroup>('api/user-groups', userGroupData)
      .pipe(map((userGroup: UserGroup) => new UserGroup(userGroup)));
  }
}
