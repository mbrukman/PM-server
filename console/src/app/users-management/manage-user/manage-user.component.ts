import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { User } from '@app/services/users/user.model';
import { UserService } from '@app/services/users/user.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EditUserComponent } from '../edit-user/edit-user.component';

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit, OnDestroy {

  @ViewChild(EditUserComponent)
  private editUserComponent: EditUserComponent;

  public user: User;
  private mainSubscription = new Subscription();

  constructor(private userService: UserService, private route: ActivatedRoute) { }

  get formInvalid(): boolean {
    return this.editUserComponent.editUserForm.invalid;
  }

  ngOnInit() {
    this.mainSubscription.add(this.route.paramMap
      .pipe(
        switchMap(paramMap => this.userService.getUser(paramMap.get('id')))
      ).subscribe(user => {
        this.user = user;
      })
    );
  }

  deleteUser() {
    throw new Error('not implemented');
  }

  saveUser() {
    this.mainSubscription.add(
      this.userService.updateUser(this.user._id, this.editUserComponent.editUserForm.value)
      .subscribe(updatedUser => {
        this.user = updatedUser;
      })
    );
  }


  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

}
