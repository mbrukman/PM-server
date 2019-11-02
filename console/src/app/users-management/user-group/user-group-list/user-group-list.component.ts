import {Component, OnInit, ElementRef, ViewChild, OnDestroy} from '@angular/core';
import {Subscription, fromEvent} from 'rxjs';
import {ActivatedRoute, Data} from '@angular/router';
import {debounceTime, switchMap} from 'rxjs/operators';
import {FilterOptions} from '@app/shared/model/filter-options.model';
import UserGroup from '@app/services/user-group/user-group.model';
import {UserGroupService} from '@app/services/user-group/user-group.service';
import {BsModalService} from 'ngx-bootstrap';
import {UserGroupCreateModalComponent} from '@app/users-management/user-group/user-group-list/user-group-create-modal/user-group-create-modal.component';
import UserGroupDataInterface from '@app/services/user-group/user-group-data.interface';


@Component({
  selector: 'app-user-group-list',
  templateUrl: './user-group-list.component.html',
  styleUrls: ['./user-group-list.component.scss']
})
export class UserGroupListComponent implements OnInit, OnDestroy {
  filterOptions: FilterOptions = new FilterOptions();
  resultCount: number = 0;
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
    private modalService: BsModalService
  ) {
  }

  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  ngOnInit() {
    // const routerSubscription = this.route.data.subscribe((data: Data) => {
    //   this.userGroups = data['userGroups'].items;
    //   this.resultCount = data['userGroups'].totalCount;
    // });
    const filterSubscription = this.filterKeyUpSubscribe = fromEvent(
      this.globalFilterElement.nativeElement,
      'keyup'
    )
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.filterOptions.page = 1;
        // this.onDataLoad();
      });
    this.mainSubscription.add(filterSubscription);
    // this.mainSubscription.add(routerSubscription);
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

  // onDataLoad() {
  //   const getAllUserSubscription = this.userGroupService.getAll(null, this.filterOptions).subscribe(users => {
  //     this.userGroups = users.items;
  //     this.resultCount = users.totalCount;
  //   });
  //   this.mainSubscription.add(getAllUserSubscription);
  // }


  openCreateModal() {
    const modal = this.modalService.show(UserGroupCreateModalComponent);
    modal.content.onClose
      .pipe(switchMap((userGroupData: UserGroupDataInterface) => this.userGroupService.createUserGroup(userGroupData)))
      .subscribe((newGroup) => this.userGroups.push(newGroup));
  }

  // createNewGroup(userGroupData:) {
  //
  // }

  // editGroup(idx, newData: ) {
  //
  // }

  // editUser(index) {
  //   this.upsertGroup(this.userGroups[index], true);
  // }

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
}
