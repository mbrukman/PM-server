import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {forkJoin, merge, Observable, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {UserService} from '@app/services/users/user.service';
import {ActivatedRoute} from '@angular/router';
import {BsModalService} from 'ngx-bootstrap';
import {map, switchMap, tap} from 'rxjs/operators';
import {FilterOptions} from '@shared/model/filter-options.model';
import {ConfirmComponent} from '@shared/confirm/confirm.component';
import {User} from '@app/services/users/user.model';
import {UserAttachUserGroupModalComponent} from '@app/users-management/iam-user/user-details-groups/user-attach-user-group-modal/user-attach-user-group-modal.component';

@Component({
  selector: 'app-user-details-groups',
  templateUrl: './user-details-groups.component.html',
  styleUrls: ['./user-details-groups.component.scss']
})
export class UserDetailsGroupsComponent implements OnInit, OnDestroy {

  @Input() getUser$: Observable<User>;

  public updateSubject = new Subject<User>();
  public detachUserSubject = new Subject();
  public groupFilterSubject = new Subject<string>();
  public mainSubscription = new Subscription();

  public user$: Observable<User>;
  public user: User;

  constructor(
    private userGroupService: UserGroupService,
    private userService: UserService,
    private activeRoute: ActivatedRoute,
    private modalService: BsModalService
  ) {
  }

  ngOnInit() {
    const id: string = this.activeRoute.snapshot.paramMap.get('id');
    const getFilteredUser$ = this.groupFilterSubject.pipe(
      switchMap((name: string) => this.userService.getUser(id, new FilterOptions({globalFilter: name})))
    );

    this.user$ = merge(
      this.getUser$,
      this.getDetachGroup$(),
      getFilteredUser$,
      this.updateSubject
    ).pipe(
      tap(user => this.user = user)
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

  getDetachGroup$(): Observable<User> {
    return this.detachUserSubject
      .pipe(
        map((groupToDetach: UserGroup) => {
          this.user.groups = this.user.groups.filter((group: UserGroup | string) => {
            if (typeof group === 'string') {
              return group !== groupToDetach._id;
            }
            return group._id !== groupToDetach._id;
          });
          groupToDetach.users = groupToDetach.users.filter((user: string|User) => {
            if (typeof user === 'string') {
              return user !== this.user._id;
            }
            return user._id !== this.user._id;
          });
          return groupToDetach;
        }),
        switchMap((groupToDetach: UserGroup) => {
          return forkJoin(
            this.userGroupService.patchOne(groupToDetach._id, {users: groupToDetach.users}),
            this.userService.patchOne(this.user._id, {groups: (this.user.groups as Array<UserGroup>)})
          );
        }),
        map(([userGroup, user]) => user)
      );
  }

  openAttachGroupModal() {
    const initialState = {
      user: Object.assign({}, this.user)
    };

    const modal = this.modalService.show(UserAttachUserGroupModalComponent, {
      initialState
    });

    modal.content.user = this.user;
    const onCloseSubscription = modal.content.onClose
      .subscribe((user: User) => this.updateSubject.next(user));

    this.mainSubscription.add(onCloseSubscription);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
