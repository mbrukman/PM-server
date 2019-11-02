import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { IEntityList } from '../../shared/interfaces/entity-list.interface';
import { FilterOptions } from '../../shared/model/filter-options.model';
import UserGroup from '@app/services/user-group/user-group.model';
import { UserGroupService } from '@app/services/user-group/user-group.service';

@Injectable({ providedIn: 'root' })
export class UserGroupResolver implements Resolve<IEntityList<UserGroup>> {
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private userGroupService: UserGroupService, private router: Router) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IEntityList<UserGroup>> {
        return this.userGroupService.getAllGroups(null, this.filterOptions);
    }
}
