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
import { IAMPolicyService } from '@app/services/iam-policy/iam-policy.service';
import { Permissions } from '@app/services/policy/permissions.interface';
import { IAMPolicy } from '@app/services/policy/iam-policy.interface';
import { PolicyService } from '@app/services/policy/policy.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  public user: User;
  public user$: Observable<User>;

  public iamPolicy: Subject<IAMPolicy> = new Subject<IAMPolicy>();

  @ViewChild(EditUserComponent)
  private editUserComponent: EditUserComponent;

  private mainSubscription = new Subscription();

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private iamPolicyService: IAMPolicyService,
    private popupService: PopupService,
    private policyService: PolicyService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user$ = this.route.paramMap.pipe(
      switchMap(paramMap => this.userService.getUser(paramMap.get('id'))),
      tap(user => (this.user = user))
    );

    this.mainSubscription.add(
      this.iamPolicy.subscribe(policy => {
        this.user.iamPolicy.permissions = policy.permissions;
      })
    );
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

  saveIAMPolicy() {
    this.mainSubscription.add(
      this.policyService.updateIAMPolicy(this.user.iamPolicy).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
