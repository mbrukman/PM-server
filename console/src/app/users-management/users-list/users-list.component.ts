import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { User } from '../../services/users/user.model';
import { Subscription, fromEvent } from 'rxjs';
import { UserService } from '@app/services/users/user.service';
import { ActivatedRoute, Data } from '@angular/router';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { FilterOptions } from '@app/shared/model/filter-options.model';
import { BsModalService } from 'ngx-bootstrap';
import { CreateUserComponent } from './create-user/create-user.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  filterOptions: FilterOptions = new FilterOptions();
  resultCount: number = 0;
  users: User[];
  filterKeyUpSubscribe: Subscription;
  isInit: boolean = true;

  private mainSubscription = new Subscription();

  fields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Groups', value: 'groups' },
    { label: 'Date Created', value: 'createdAt' }
  ];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private modalService: BsModalService
  ) { }
  @ViewChild('globalFilter') globalFilterElement: ElementRef;

  ngOnInit() {
    const routerSubscription = this.route.data.subscribe((data: Data) => {
      this.users = data['users'].items;
      this.resultCount = data['users'].totalCount;
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

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

  onDataLoad(): void {
    const getAllUserSubscription = this.userService.getAllUsers(null, this.filterOptions).subscribe(users => {
      this.users = users.items;
      this.resultCount = users.totalCount;
    });
    this.mainSubscription.add(getAllUserSubscription);
  }


  openCreateModal() {
    const modal = this.modalService.show(CreateUserComponent);
    const onCloseSubscription = modal.content.onClose
      .pipe(
        switchMap((userData: User) => this.userService.createUser(userData)),
      )
      .subscribe((newUser: User) => {
        this.users = [...this.users, newUser] ;
      });

    this.mainSubscription.add(onCloseSubscription);
  }

  editUser(index: string | number) {
    throw new Error('Method not implemented.');
  }

  deleteUser(id: string): void {
    const deleteUserSubScription = this.userService.deleteUser(id).subscribe(() => this.onDataLoad());
    this.mainSubscription.add(deleteUserSubScription);
  }

  loadUserLazy(event: { first: number; sortField: any; sortOrder: number; }) {
    let page: number;
    let sort: string;
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
}
