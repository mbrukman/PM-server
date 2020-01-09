import {Component, OnDestroy} from '@angular/core';
import {TermsOfUseService} from '@app/services/terms-of-use/terms-of-use.service';
import {switchMap, filter} from 'rxjs/operators';
import {Router} from '@angular/router';
import {of, Subscription} from 'rxjs';
import {fromPromise} from "rxjs/internal-compatibility";

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
    this.mainSubscription.add(
      of(this.isAccepted)
        .pipe(
          filter(isAccepted => isAccepted),
          switchMap(() => this.tosService.updateAndCheckTermsOfUse()),
          switchMap(() => fromPromise(this.router.navigate(['/'])))
        )
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
