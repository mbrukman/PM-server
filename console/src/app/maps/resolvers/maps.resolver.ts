import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Map} from '@app/services/map/models/map.model';
import {Observable} from 'rxjs/Observable';
import {MapsService} from '@app/services/map/maps.service';
import {Injectable} from '@angular/core';
import {FilterOptions} from '@shared/model/filter-options.model';
import {IEntityList} from '@shared/interfaces/entity-list.interface';

@Injectable()
export class MapsResolver implements Resolve<IEntityList<Map>> {
  filterOptions: FilterOptions = new FilterOptions();

  constructor(private mapsService: MapsService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IEntityList<Map>> {
    const filterKeys = Object.keys(route.queryParams);
    filterKeys.forEach(field => {
      this.filterOptions[field] = route.queryParams[field] || this.filterOptions[field];
    });
    return this.mapsService.filterMaps(null, this.filterOptions);
  }
}
