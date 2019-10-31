import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { User } from '../models/user.model';
import { Subscription, fromEvent } from 'rxjs';
import { UsersManagementService } from '../users-management.service';
import { ActivatedRoute, Data } from '@angular/router';
import { PopupService } from '@app/shared/services/popup.service';
import { debounceTime } from 'rxjs/operators';
import { FilterOptions } from '@app/shared/model/filter-options.model';
@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  filterOptions: FilterOptions = new FilterOptions();
  resultCount: number = 0;
  users: User[];
  filterKeyUpSubscribe: Subscription;
  isInit: boolean = true;

  fields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Groups', value: 'groups' },
    { label: 'Date Created', value: 'date_created' }
  ];
  constructor(
    private usersManagementService: UsersManagementService,
    private route: ActivatedRoute,
    private popupService: PopupService
  ) {}
  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  ngOnInit() {
    this.route.data.subscribe((data: Data) => {
      this.users = data['users'].items;
      this.resultCount = data['users'].totalCount;
    });
    this.filterKeyUpSubscribe = fromEvent(
      this.globalFilterElement.nativeElement,
      'keyup'
    )
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.filterOptions.page = 1;
        this.onDataLoad();
      });
  }

  onDataLoad() {
    this.usersManagementService.getAllUsers(null, this.filterOptions).subscribe(users => {
      this.users = users.items;
      this.resultCount = users.totalCount;
    });
  }

  upsertUser(user = {}, isEdit = false) {}

  editUser(i) {
    this.upsertUser(this.users[i], true);
  }

  deleteUser(id) {
    console.log(id);
  }

  loadUserLazy(event) {
    let page;
    let sort;
    if (event) {

      page = event.first / 15 + 1;
      if (event.sortField) {
        sort =
          event.sortOrder === -1 ? '-' + event.sortField : event.sortField;
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
}
