import {Component, OnDestroy, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {UserService} from '@app/services/users/user.service';
import {User} from '@app/services/users/user.model';
import {forkJoin, merge, of, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {map, switchMap, tap} from 'rxjs/operators';
import UserFilterOptions from '@app/services/users/user-filter-options.model';
import _ from 'lodash';

@Component({
  selector: 'app-user-group-attach-users-modal',
  templateUrl: './user-group-attach-users-modal.component.html',
  styleUrls: ['./user-group-attach-users-modal.component.scss']
})
export class UserGroupAttachUsersModalComponent implements OnInit, OnDestroy {
  public users: Array<User> = [];
  public userSubject = new Subject();
  public userFilterSubject = new Subject();
  public userLazyLoadSubject = new Subject();
  public newUsersCollection: { [key: string]: User } = {};
  public mainSubscription = new Subscription();

  public userGroup: UserGroup;
  public onClose = new Subject();
  public totalUsersCount: number;

  constructor(
    public bsModalRef: BsModalRef,
    private userService: UserService,
    private userGroupService: UserGroupService
  ) {
  }

  get newUsersCollectionLength (): number {
    return Object.keys(this.newUsersCollection).length;
  }

  ngOnInit() {
    const userCheckSubscription = this.userSubject
      .subscribe(([isAdded, user]) => {
        if (isAdded) {
          this.newUsersCollection[user._id] = user;
        } else {
          delete this.newUsersCollection[user._id];
        }
      });

    const listUsersSubscription = merge(
      of(new UserFilterOptions()),
      this.userLazyLoadSubject,
      this.userFilterSubject,
    )
      .pipe(
        switchMap((globalFilter: UserFilterOptions) => {
          const filters = _.merge({
            sort: 'asc',
            globalFilter: name,
            notInGroup: this.userGroup._id
          }, globalFilter);
          return this.userService.getAllUsers(null, filters);
        }),
        tap(resp => this.totalUsersCount = resp.totalCount)
      )
      .subscribe(resp => this.users = resp.items);

    this.mainSubscription.add(userCheckSubscription);
    this.mainSubscription.add(listUsersSubscription);
  }

  private prepareUserGroups() {
    const usersToPatch = {};
    Object.entries(this.newUsersCollection)
      .forEach(([userId, user]) => {
        user.groups.push(this.userGroup);
        usersToPatch[userId] = {groups: user.groups};
      });
    return this.userService.patchMany(usersToPatch);
  }

  private preparePatchGroupData() {
    const users = Object.values(this.newUsersCollection)
      .concat(this.userGroup.users as Array<User>);
    return this.userGroupService.patchOne(this.userGroup._id, {
      users,
    });
  }

  onAction(e: string){
    if (e === 'save') {
      this.saveGroups();
    }else {
      this.bsModalRef.hide();
    }
  }

  saveGroups() {
    forkJoin(
      this.prepareUserGroups(),
      this.preparePatchGroupData()
    )
      .pipe(map(([user, userGroup]) => {
        if (userGroup.name) {
          this.onClose.next(userGroup);
        }
      }))
      .subscribe(() => this.bsModalRef.hide());
  }

  filterUsers(name) {
    this.userFilterSubject.next(new UserFilterOptions({
      globalFilter: name
    }));
  }

  lazyLoadUsers(event: { first: number; sortField: any; sortOrder: number; }) {
    const filterOptions = new UserFilterOptions();
    if (event) {
      filterOptions.page = event.first / 15 + 1;
      if (event.sortField) {
        filterOptions.sort =
          event.sortOrder === -1 ? `-${event.sortField}` : event.sortField;
      }
    }
    this.userLazyLoadSubject.next(filterOptions);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
