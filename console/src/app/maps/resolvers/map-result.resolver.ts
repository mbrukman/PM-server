import {Injectable} from '@angular/core';
import {MapsService} from '@app/services/map/maps.service';
import {catchError, map, take} from 'rxjs/operators';

import {Resolve, Router} from '@angular/router';

import {ActivatedRouteSnapshot} from '@angular/router';
import {of, forkJoin} from 'rxjs';

@Injectable()
export class MapResultResolver implements Resolve<any> {
  constructor(
    private mapsService: MapsService,
    private router: Router
  ) {
  }

  resolve(route: ActivatedRouteSnapshot) {
    return forkJoin(
      this.mapsService.executionResultDetail(
        route.parent.paramMap.get('id'),
        route.paramMap.get('resultId')).pipe(
        catchError(err => {
          this.router.navigate(['/not-found']);
          return of(null);
        })),
      this.mapsService.currentExecutionList().pipe(
        take(1)
      )
    ).pipe(
      map(allResponses => {
        return {
          selectedExecution: allResponses[0],
          onGoing: allResponses[1]
        };
      })
    );
  }
}



