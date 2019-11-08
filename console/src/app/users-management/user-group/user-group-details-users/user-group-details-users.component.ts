import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {ActivatedRoute} from '@angular/router';
import {fromEvent, merge, Observable, Subject, Subscription} from 'rxjs';
import UserGroup from '@app/services/user-group/user-group.model';
import {switchMap, tap} from 'rxjs/operators';
import {BsModalService} from 'ngx-bootstrap';
import {UserGroupAttachUsersModalComponent} from '@app/users-management/user-group/user-group-details-users/user-group-attach-users-modal/user-group-attach-users-modal.component';

@Component({
  selector: 'app-user-group-details-users',
  templateUrl: './user-group-details-users.component.html',
  styleUrls: ['./user-group-details-users.component.scss']
})
export class UserGroupDetailsUsersComponent implements OnInit, OnDestroy {
  @ViewChild('filterInput') filterInput: ElementRef;

  public updateSubject = new Subject<UserGroup>();
  public mainSubscription = new Subscription();

  public userGroup$: Observable<UserGroup>;
  public userGroup: UserGroup;

  constructor(
    private userGroupService: UserGroupService,
    private activeRoute: ActivatedRoute,
    private modalService: BsModalService
  ) {
  }

  ngOnInit() {
    const id: string = this.activeRoute.snapshot.paramMap.get('id');

    const getGroup$ = this.userGroupService.getOne(id);
    const getFilteredGroup$ = fromEvent(
      this.filterInput.nativeElement,
      'keyup'
    ).pipe(
      switchMap((e: KeyboardEvent) => this.userGroupService.getOne(id, (e.target as HTMLInputElement).value))
    );

    this.userGroup$ = merge(
      getGroup$,
      getFilteredGroup$,
      this.updateSubject
    ).pipe(
      tap(group => this.userGroup = group));
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
