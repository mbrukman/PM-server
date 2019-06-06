import { Injectable } from '@angular/core';
import { MapsService } from '../maps.service';
import { catchError } from 'rxjs/operators';

import { Resolve, Router } from '@angular/router';

import { ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';

@Injectable()
export class MapResultResolver implements Resolve<any> {
    constructor(private mapsService: MapsService, private router: Router) { }

    resolve(route: ActivatedRouteSnapshot) {
        return this.mapsService.executionResultDetail(route.parent.paramMap.get('id'), route.paramMap.get('resultId')).pipe(
            catchError(err => {
                this.router.navigate(['/not-found']);
                return of(null)
            }))
    }

}



