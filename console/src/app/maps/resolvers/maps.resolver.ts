import { Resolve, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Map } from '@maps/models/map.model';
import { Observable } from 'rxjs/Observable';
import { MapsService } from '../maps.service';
import { Injectable } from '@angular/core';
import { FilterOptions } from '@shared/model/filter-options.model';
import { IEntityList } from '@shared/interfaces/entity-list.interface';

@Injectable()
export class MapsResolver implements Resolve<IEntityList<Map>>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private mapsService: MapsService) { };

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IEntityList<Map>> {
        return this.mapsService.filterMaps(null, 1, this.filterOptions);
    }
} 