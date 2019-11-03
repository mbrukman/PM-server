import {Component, OnInit, ElementRef, ViewChild, OnDestroy} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap';
import {Subscription, fromEvent} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounceTime, switchMap} from 'rxjs/operators';

import UserGroup from '@app/services/user-group/user-group.model';
import {FilterOptions} from '@app/shared/model/filter-options.model';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {UserGroupCreateModalComponent} from '@app/users-management/user-group/user-group-list/user-group-create-modal/user-group-create-modal.component';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';
import { PopupService } from '@app/shared/services/popup.service';

@Component({
  selector: 'app-user-group-list',
  templateUrl: './user-group-list.component.html',
  styleUrls: ['./user-group-list.component.scss']
})
export class UserGroupListComponent implements OnInit, OnDestroy {
  filterOptions: FilterOptions = new FilterOptions();
  userGroups: UserGroup[] = [];
  filterKeyUpSubscribe: Subscription;
  isInit: boolean = true;

  private mainSubscription = new Subscription();

  fields = [
    {label: 'Name', value: 'name'},
    {label: 'Email', value: 'email'},
    {label: 'Groups', value: 'groups'},
    {label: 'Date Created', value: 'date_created'}
  ];

  constructor(
    private userGroupService: UserGroupService,
    private route: ActivatedRoute,
    private popupService: PopupService
  ) {
  }

  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  ngOnInit() {
    const filterSubscription = this.filterKeyUpSubscribe = fromEvent(
      this.globalFilterElement.nativeElement,
      'keyup'
    )
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.filterOptions.page = 1;
      });

    this.mainSubscription.add(filterSubscription);
  }

  openCreateModal() {
    const modal = this.modalService.show(UserGroupCreateModalComponent);
    const onCloseSubscription = modal.content.onClose
      .pipe(switchMap((userGroupData: UserGroupDataInterface) => this.userGroupService.createUserGroup(userGroupData)))
      .subscribe((newGroup) => this.userGroups.push(newGroup));

    this.mainSubscription.add(onCloseSubscription);
  }

  deleteUser(id) {
    console.log(id);
  }

  loadUserGroupLazy(event) {
    let page;
    let sort;
    if (event) {
      page = event.first / 15 + 1;
      if (event.sortField) {
        sort =
          event.sortOrder === -1 ? `-${event.sortField}` : event.sortField;
      }
    }
    if (this.isInit) {
      this.isInit = false;
      return;
    }
    this.filterOptions.page = page;
    this.filterOptions.sort = sort;
    // this.onDataLoad();
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
