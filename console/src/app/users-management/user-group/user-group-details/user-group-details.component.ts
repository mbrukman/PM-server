import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {switchMap, tap} from 'rxjs/operators';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import UserGroup from '@app/services/user-group/user-group.model';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-user-group-details',
  templateUrl: './user-group-details.component.html',
  styleUrls: ['./user-group-details.component.scss']
})
export class UserGroupDetailsComponent implements OnInit {

  public userGroup$: Observable<UserGroup>;

  constructor(
    private userGroupService: UserGroupService,
    private activedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.userGroup$ = this.activedRoute.paramMap.pipe(
      switchMap((paramMap: ParamMap) => {
          return this.userGroupService.getOne(paramMap.get('id'));
        })
      );
  }

}
