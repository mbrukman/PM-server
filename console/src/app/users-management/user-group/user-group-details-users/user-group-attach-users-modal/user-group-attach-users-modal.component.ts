import {Component, OnDestroy, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {UserService} from '@app/services/users/user.service';
import {User} from '@app/services/users/user.model';
import {Subject, Subscription} from 'rxjs';
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
          this.newUsersList[user.id] = user;
        } else {
          delete this.newUsersList[user.id];
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

  saveGroups() {
    this.userGroupService.patchOne({
      users: Object.values(this.newUsersList)
    })
      .pipe(map(userGroup => this.onClose.next(userGroup)))
      .subscribe(() => this.bsModalRef.hide());
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
