import { Resolve, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {Map} from '@maps/models/map.model';
import {Observable} from 'rxjs/Observable';
import { MapsService } from './maps.service';
import { Injectable } from '@angular/core';
import { FilterOptions } from '@shared/model/filter-options.model'

@Injectable()
export class MapsResolver implements Resolve<{items:Map[],totalCount:number}>{
    filterOptions: FilterOptions = new FilterOptions();
    constructor(private mapsService:MapsService){};

    resolve(route:ActivatedRouteSnapshot,state:RouterStateSnapshot):Observable<{items:Map[],totalCount:number}> | 
    Promise<{items:Map[],totalCount:number}> | {items:Map[],totalCount:number}{
        return this.mapsService.filterMaps(null,1,this.filterOptions);
    }
} 