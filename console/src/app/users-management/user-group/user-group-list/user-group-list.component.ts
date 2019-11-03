import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { ActivatedRoute, Data } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs/operators';
import { FilterOptions } from '@app/shared/model/filter-options.model';
import UserGroup from '@app/services/user-group/user-group.model';
import {UserGroupCreateModalComponent} from '@app/users-management/user-group/user-group-list/user-group-create-modal/user-group-create-modal.component';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';
import { UserGroupService } from '@app/services/user-group/user-group.service';
import { BsModalService } from 'ngx-bootstrap';

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
  resultCount: number;
  private mainSubscription = new Subscription();

  fields = [
    { label: 'Group Name', value: 'name' },
    { label: 'Number of users', value: 'users' },
  ];
  constructor(
    private userGroupService: UserGroupService,
    private route: ActivatedRoute,
    private modalService: BsModalService
  ) {
  }

  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  ngOnInit() {
    const routerSubscription = this.route.data.subscribe((data: Data) => {
      this.userGroups = data['groups'].items;
      this.resultCount = data['groups'].totalCount;
    });
    const filterSubscription = this.filterKeyUpSubscribe = fromEvent(
      this.globalFilterElement.nativeElement,
      'keyup'
    )
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.filterOptions.page = 1;
        this.onDataLoad();
      });
    this.mainSubscription.add(filterSubscription);
    this.mainSubscription.add(routerSubscription);
  }


  openCreateModal() {
    const modal = this.modalService.show(UserGroupCreateModalComponent);
    const onCloseSubscription = modal.content.onClose
      .pipe(switchMap((userGroupData: UserGroupDataInterface) => this.userGroupService.createUserGroup(userGroupData)))
      .subscribe((newGroup) => this.userGroups.push(newGroup));

    this.mainSubscription.add(onCloseSubscription);
  }


  onDataLoad() {
    const getAllGroupSubscription = this.userGroupService.getAllGroups(null, this.filterOptions).subscribe(groups => {
      this.userGroups = groups.items;
      this.resultCount = groups.totalCount;
    });
    this.mainSubscription.add(getAllGroupSubscription);
  }

  // editGroup(index) {
  //   this.upsertGroup(this.userGroups[index], true);
  // }

  deleteGroup(id: string): void {
    console.log(id);
  }

  loadGroupLazy(event: any): void {
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
    this.onDataLoad();
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}






