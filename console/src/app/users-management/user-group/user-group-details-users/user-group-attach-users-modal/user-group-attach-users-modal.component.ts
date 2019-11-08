import {Component, OnDestroy, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {UserService} from '@app/services/users/user.service';
import {User} from '@app/services/users/user.model';
import {forkJoin, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-user-group-attach-users-modal',
  templateUrl: './user-group-attach-users-modal.component.html',
  styleUrls: ['./user-group-attach-users-modal.component.scss']
})
export class UserGroupAttachUsersModalComponent implements OnInit, OnDestroy {
  public users: Array<User> = [];
  public userSubject = new Subject();
  public newUsersList: { [key: string]: User } = {};
  public mainSubscription = new Subscription();

  public userGroup: UserGroup;
  public onClose = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private userService: UserService,
    private userGroupService: UserGroupService
  ) {
  }

  ngOnInit() {
    const userCheckSubscription = this.userSubject
      .subscribe(([isAdded, user]) => {
        if (isAdded) {
          this.newUsersList[user._id] = user;
        } else {
          delete this.newUsersList[user._id];
        }
      });

    const listUsersSubscription = this.userService.getAllUsers(null, {
      sort: 'asc',
      notInGroup: this.userGroup._id
    })
      .subscribe(resp => this.users = resp.items);

    this.mainSubscription.add(userCheckSubscription);
    this.mainSubscription.add(listUsersSubscription);
  }

  private prepareUserGroups() {
    const usersToPatch = {};
    Object.entries(this.newUsersList)
      .forEach(([userId, user]) => {
        user.groups.push(this.userGroup);
        usersToPatch[userId] = {groups: user.groups};
      });
    return this.userService.patchMany(usersToPatch);
  }

  private preparePatchGroupData() {
    const users = Object.values(this.newUsersList)
      .concat(this.userGroup.users);
    return this.userGroupService.patchOne(this.userGroup._id, {
      users,
    });
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

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
