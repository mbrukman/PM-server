import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { UserGroupService } from '@app/services/user-group/user-group.service';
import UserGroup from '@app/services/user-group/user-group.model';
import { Observable, Subject, Subscription } from 'rxjs';
import { IAMPolicy } from '@app/services/iam-policy/iam-policy.interface';
import { IAMPolicyService } from '@app/services/iam-policy/iam-policy.service';

@Component({
  selector: 'app-user-group-details',
  templateUrl: './user-group-details.component.html',
  styleUrls: ['./user-group-details.component.scss']
})
export class UserGroupDetailsComponent implements OnInit, OnDestroy {
  public userGroup: UserGroup;
  public userGroup$: Observable<UserGroup>;
  public iamPolicySubject: Subject<IAMPolicy> = new Subject<IAMPolicy>();

  private mainSubscription = new Subscription();

  constructor(
    private userGroupService: UserGroupService,
    private activedRoute: ActivatedRoute,
    private iamPolicyService: IAMPolicyService
  ) { }

  ngOnInit() {
    this.userGroup$ = this.activedRoute.paramMap.pipe(
      switchMap((paramMap: ParamMap) => {
        return this.userGroupService.getOne(paramMap.get('id'));
      }),
      tap(userGroup => {
        this.userGroup = userGroup;
      })
    );

    this.mainSubscription.add(
      this.iamPolicySubject.subscribe(policy => {
        this.userGroup.iamPolicy.permissions = policy.permissions;
      })
    );
  }

  saveIAMPolicy() {
    this.mainSubscription.add(
      this.iamPolicyService.updateIAMPolicy(this.userGroup.iamPolicy).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
