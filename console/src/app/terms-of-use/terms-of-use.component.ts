import {Component, OnDestroy} from '@angular/core';
import {TermsOfUseService} from '@app/services/terms-of-use/terms-of-use.service';
import {switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {fromPromise} from 'rxjs/internal-compatibility';
import {of, Subscription} from 'rxjs';

@Component({
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.scss']
})
export class TermsOfUseComponent implements OnDestroy {

  public isAccepted: boolean = false;
  private mainSubscription = new Subscription();

  constructor(
    private tosService: TermsOfUseService,
    private router: Router
  ) {
  }

  acceptTermsOfUse() {
    if (!this.isAccepted) {
      return false;
    }
    this.mainSubscription.add(this.tosService.updateAndCheckTermsOfUse()
      .pipe(
        switchMap((isAccepted) => {
          if (isAccepted) {
            return fromPromise(this.router.navigate(['/']));
          }
          return of(false);
        })
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
