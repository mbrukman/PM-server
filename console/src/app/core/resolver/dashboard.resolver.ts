import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {MapsService} from '@maps/maps.service';
import {Injectable} from '@angular/core';
import {DistinctMapResult} from '@shared/model/distinct-map-result.model';

@Injectable()
export class DashboardResolver implements Resolve<DistinctMapResult[]> {

  constructor(
    private mapsService: MapsService
  ) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DistinctMapResult[]> {
    return this.mapsService.getDistinctMapExecutionsResult();
  }
}
