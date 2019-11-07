import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '@app/services/users/user.model';
import { UserService } from '@app/services/users/user.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit, OnDestroy {

  public user: User;
  private mainSubscription = new Subscription();

  constructor(private userService: UserService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.mainSubscription.add(this.route.paramMap
      .pipe(
        switchMap(paramMap => this.userService.getUser(paramMap.get('id')))
      ).subscribe(user => {
        this.user = user;
      })
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
