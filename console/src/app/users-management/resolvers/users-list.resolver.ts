import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import {User} from '../models/user.model';
import { UsersManagementService } from '../users-management.service';
import { Injectable } from '@angular/core';
import {IEntityList} from '../../shared/interfaces/entity-list.interface';
import {FilterOptions} from '../../shared/model/filter-options.model';

@Injectable()
export class UsersListResolver implements Resolve<IEntityList<User>>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private usersService: UsersManagementService, private router: Router ) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IEntityList<User>>{
      return this.usersService.getAllUsers(null, this.filterOptions);
    }
}
