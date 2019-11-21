import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { User } from '@app/services/users/user.model';
import { UserService } from '@app/services/users/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { switchMap, filter, tap } from 'rxjs/operators';
import { EditUserComponent } from '../users-list/edit-user/edit-user.component';
import { PopupService } from '@shared/services/popup.service';
import { Permissions } from '@app/services/users/permissions.interface';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  public user: User;
  public user$: Observable<User>;

  public iamPolicy: Subject<Permissions> = new Subject<Permissions>();

  @ViewChild(EditUserComponent)
  private editUserComponent: EditUserComponent;

  private mainSubscription = new Subscription();

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private popupService: PopupService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.user$ = this.route.paramMap.pipe(
      switchMap(paramMap => this.userService.getUser(paramMap.get('id'))),
      tap(user => (this.user = user))
    );

    this.iamPolicy.subscribe(permissions => {
      this.user.iamPolicy.permissions = permissions;
    });
  }

  deleteUser() {
    const confirm = 'Yes, delete.';
    this.mainSubscription.add(
      this.popupService
        .openConfirm(
          'Are you sure?',
          'Are you sure you want to delete the user: ' + this.user.name,
          confirm,
          null,
          null
        )
        .pipe(
          filter(result => result === confirm),
          switchMap(() => this.userService.deleteUser(this.user._id))
        )
        .subscribe(() => {
          alert('User ' + this.user.name + ' has been deleted.');
          this.router.navigateByUrl('/admin/users-management/users');
        })
    );
  }

  saveUser() {
    this.mainSubscription.add(
      this.userService
        .updateUser(this.user._id, this.editUserComponent.editUserForm.value)
        .subscribe(updatedUser => {
          this.user = updatedUser;
        })
    );
  }

  savePolicies() {
    this.userService.updateIAMPolicy(
      this.user.iamPolicy._id,
      this.user.iamPolicy.permissions
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
