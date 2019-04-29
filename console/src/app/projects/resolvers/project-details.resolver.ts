import { Resolve, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Project } from '@projects/models/project.model';
import { Observable } from 'rxjs/Observable';
import { ProjectsService } from '../projects.service';
import { Injectable } from '@angular/core';
import { FilterOptions } from '@shared/model/filter-options.model';


@Injectable()
export class ProjectDetailsResolver implements Resolve<Project>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private projectsService: ProjectsService) { };

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Project> {
        return this.projectsService.detail(route.params.id, this.filterOptions)
    }
} 