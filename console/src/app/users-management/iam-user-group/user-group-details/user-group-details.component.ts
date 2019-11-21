import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { UserGroupService } from '@app/services/user-group/user-group.service';
import UserGroup from '@app/services/user-group/user-group.model';
import { Observable, Subject, Subscription } from 'rxjs';
import { IAMPolicy } from '@app/services/policy/iam-policy.interface';
import { PolicyService } from '@app/services/policy/policy.service';

@Component({
  selector: 'app-user-group-details',
  templateUrl: './user-group-details.component.html',
  styleUrls: ['./user-group-details.component.scss']
})
export class UserGroupDetailsComponent implements OnInit {
  public userGroup: UserGroup;
  public userGroup$: Observable<UserGroup>;
  public iamPolicy: Subject<IAMPolicy> = new Subject<IAMPolicy>();

  private mainSubscription = new Subscription();

  constructor(
    private userGroupService: UserGroupService,
    private activedRoute: ActivatedRoute,
    private policyService: PolicyService
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
  }

  saveIAMPolicy() {
    this.mainSubscription.add(
      this.policyService.updateIAMPolicy(this.userGroup.iamPolicy).subscribe()
    );
  }
}
