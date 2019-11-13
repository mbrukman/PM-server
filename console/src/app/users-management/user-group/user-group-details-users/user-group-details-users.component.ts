import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {ActivatedRoute} from '@angular/router';
import {forkJoin, merge, Observable, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {map, switchMap, tap} from 'rxjs/operators';
import {BsModalService} from 'ngx-bootstrap';
import {UserGroupAttachUsersModalComponent} from '@app/users-management/user-group/user-group-details-users/user-group-attach-users-modal/user-group-attach-users-modal.component';
import {FilterOptions} from '@shared/model/filter-options.model';
import {User} from '@app/services/users/user.model';
import {UserService} from '@app/services/users/user.service';
import {ConfirmComponent} from "@shared/confirm/confirm.component";

@Component({
  selector: 'app-user-group-details-users',
  templateUrl: './user-group-details-users.component.html',
  styleUrls: ['./user-group-details-users.component.scss']
})
export class UserGroupDetailsUsersComponent implements OnInit, OnDestroy {

  @Input() getGroup$: Observable<UserGroup>;

  public updateSubject = new Subject<UserGroup>();
  public detachUserSubject = new Subject();
  public userFilterSubject = new Subject<string>();
  public mainSubscription = new Subscription();

  public userGroup$: Observable<UserGroup>;
  public userGroup: UserGroup;

  constructor(
    private userGroupService: UserGroupService,
    private userService: UserService,
    private activeRoute: ActivatedRoute,
    private modalService: BsModalService
  ) {
  }

  ngOnInit() {
    const id: string = this.activeRoute.snapshot.paramMap.get('id');
    const getFilteredGroup$ = this.userFilterSubject.pipe(
      switchMap((name: string) => this.userGroupService.getOne(id, new FilterOptions({globalFilter: name})))
    );

    this.userGroup$ = merge(
      this.getGroup$,
      this.getDetachUser$(),
      getFilteredGroup$,
      this.updateSubject
    ).pipe(
      tap(group => this.userGroup = group)
    );
  }

  openDetachConfirmationModal(user) {
    const modal = this.modalService.show(ConfirmComponent, {
      initialState: {
        title: 'You are about to detach the user from the group...'
      }
    });
    modal.content.result.subscribe((result) => {
      if (result === modal.content.confirm) {
        this.detachUserSubject.next(user);
      }
    });
  }

  getDetachUser$(): Observable<UserGroup> {
    return this.detachUserSubject
      .pipe(
        map((userToDetach: User) => {
          this.userGroup.users = this.userGroup.users.filter((user: User | string) => {
            if (typeof user === 'string') {
              return user !== userToDetach._id;
            }
            return user._id !== userToDetach._id;
          });
          userToDetach.groups = userToDetach.groups.filter((userGroup: string | UserGroup) => {
            if (typeof userGroup === 'string') {
              return userGroup !== this.userGroup._id;
            }
            return userGroup._id !== this.userGroup._id;

          });
          return userToDetach;
        }),
        switchMap((userToDetach: User) => {
          return forkJoin(
            this.userGroupService.patchOne(this.userGroup._id, {users: this.userGroup.users}),
            this.userService.patchOne(userToDetach._id, {groups: (userToDetach.groups as Array<UserGroup>)})
          );
        }),
        map(([userGroup, user]) => userGroup)
      );
  }

  openAttachUsersModal() {
    const initialState = {
      userGroup: Object.assign({}, this.userGroup)
    };

    const modal = this.modalService.show(UserGroupAttachUsersModalComponent, {
      initialState
    });

    modal.content.userGroup = this.userGroup;
    const onCloseSubscription = modal.content.onClose
      .subscribe((userGroup: UserGroup) => this.updateSubject.next(userGroup));

    this.mainSubscription.add(onCloseSubscription);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
