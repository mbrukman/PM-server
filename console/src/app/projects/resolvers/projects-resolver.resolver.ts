import { Resolve, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Project } from '@projects/models/project.model';
import { Observable } from 'rxjs/Observable';
import { ProjectsService } from '../projects.service';
import { Injectable } from '@angular/core';
import { FilterOptions } from '@shared/model/filter-options.model';
import { IEntityList } from '@shared/interfaces/entity-list.interface';

@Injectable()
export class ProjectsResolver implements Resolve<IEntityList<Project>>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private projectsService: ProjectsService) { };

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IEntityList<Project>> {
        return this.projectsService.filter(null, 1, this.filterOptions);
    }
} 