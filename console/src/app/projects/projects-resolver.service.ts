import { Resolve, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {Project} from '@projects/models/project.model';
import {Observable} from 'rxjs/Observable';
import { ProjectsService } from './projects.service';
import { Injectable } from '@angular/core';
import { FilterOptions } from '@shared/model/filter-options.model'

@Injectable()
export class ProjectsResolver implements Resolve<{ totalCount: number, items: Project[] }>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private projectsService:ProjectsService){};

    resolve(route:ActivatedRouteSnapshot,state:RouterStateSnapshot):Observable<{ totalCount: number, items: Project[] }> | 
    Promise<{ totalCount: number, items: Project[] }> | { totalCount: number, items: Project[] }{
        return this.projectsService.filter(null,1,this.filterOptions);
    }
} 