import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from '@app/services/users/user.model';
import {forkJoin, merge, of, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {BsModalRef} from 'ngx-bootstrap';
import {UserService} from '@app/services/users/user.service';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {map, switchMap, tap} from 'rxjs/operators';
import _ from 'lodash';
import UserGroupFilterOptions from '@app/services/users/user-group-filter-options.model';

@Component({
  selector: 'app-user-attach-user-group-modal',
  templateUrl: './user-attach-user-group-modal.component.html',
  styleUrls: ['./user-attach-user-group-modal.component.scss']
})
export class UserAttachUserGroupModalComponent implements OnInit, OnDestroy {
  public userGroups: Array<UserGroup> = [];
  public userGroupSubject = new Subject();
  public userGroupFilterSubject = new Subject();
  public userGroupLazyLoadSubject = new Subject();
  public newUserGroupsCollection: { [key: string]: UserGroup } = {};
  public mainSubscription = new Subscription();

  public user: User;
  public onClose = new Subject();
  public totalUserGroupsCount: number;

  constructor(
    public bsModalRef: BsModalRef,
    private userService: UserService,
    private userGroupService: UserGroupService
  ) {
  }

  get newUserGroupsCollectionLength(): number {
    return Object.keys(this.newUserGroupsCollection).length;
  }

  ngOnInit() {
    const userCheckSubscription = this.userGroupSubject
      .subscribe(([isAdded, userGroup]) => {
        if (isAdded) {
          this.newUserGroupsCollection[userGroup._id] = userGroup;
        } else {
          delete this.newUserGroupsCollection[userGroup._id];
        }
      });

    const listUsersSubscription = merge(
      of(new UserGroupFilterOptions()),
      this.userGroupLazyLoadSubject,
      this.userGroupFilterSubject,
    )
      .pipe(
        switchMap((globalFilter: UserGroupFilterOptions) => {
          const filters = _.merge({
            globalFilter: name,
            notInUsers: this.user._id
          }, globalFilter);
          return this.userGroupService.getAllGroups(null, filters);
        }),
        tap(resp => this.totalUserGroupsCount = resp.totalCount)
      )
      .subscribe(resp => this.userGroups = resp.items);

    this.mainSubscription.add(userCheckSubscription);
    this.mainSubscription.add(listUsersSubscription);
  }

  private prepareUserGroups() {
    const userGroupsToPatch = {};
    Object.entries(this.newUserGroupsCollection)
      .forEach(([userGroupId, userGroup]) => {
        userGroup.users.push(this.user);
        userGroupsToPatch[userGroupId] = {users: userGroup.users};
      });
    return this.userGroupService.patchMany(userGroupsToPatch);
  }

  private preparePatchUserData() {
    const groups = Object.values(this.newUserGroupsCollection)
      .concat(this.user.groups as Array<UserGroup>);
    return this.userService.updateUser(this.user._id, {
      groups,
    });
  }

  saveGroups() {
    forkJoin(
      this.prepareUserGroups(),
      this.preparePatchUserData()
    )
      .pipe(map(([userGroups, user]) => {
        if (user.name) {
          this.onClose.next(user);
        }
      }))
      .subscribe(() => this.bsModalRef.hide());
  }

  filterUserGroups(name) {
    this.userGroupFilterSubject.next(new UserGroupFilterOptions({
      globalFilter: name
    }));
  }

  lazyLoadUserGroups(event: { first: number; sortField: any; sortOrder: number; }) {
    const filterOptions = new UserGroupFilterOptions();
    if (event) {
      filterOptions.page = event.first / 15 + 1;
      if (event.sortField) {
        filterOptions.sort =
          event.sortOrder === -1 ? `-${event.sortField}` : event.sortField;
      }
    }
    this.userGroupLazyLoadSubject.next(filterOptions);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
