import {Component, OnDestroy} from '@angular/core';
import {TosService} from '@app/services/tos/tos.service';
import {switchMap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-tos',
  templateUrl: './tos.component.html',
  styleUrls: ['./tos.component.scss']
})
export class TosComponent implements OnDestroy {

  public isAccepted: boolean = false;
  private mainSubscription = new Subscription();

  constructor(
    private tosService: TosService,
    private router: Router
  ) { }

  acceptTos() {
    this.mainSubscription.add(this.tosService.updateTos(this.isAccepted)
      .pipe(
        switchMap(() => fromPromise(this.router.navigate(['/'])))
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
