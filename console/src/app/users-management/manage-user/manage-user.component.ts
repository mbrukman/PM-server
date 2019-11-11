import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef, AfterContentInit, AfterContentChecked } from '@angular/core';
import { User } from '@app/services/users/user.model';
import { UserService } from '@app/services/users/user.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { PopupService } from '@app/shared/services/popup.service';

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit, OnDestroy, AfterContentChecked {

  public user: User;

  @ViewChild(EditUserComponent)
  private editUserComponent: EditUserComponent;

  private mainSubscription = new Subscription();

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private popupService: PopupService,
    private cd: ChangeDetectorRef) { }

  get formInvalid(): boolean {
    return this.editUserComponent && this.editUserComponent.editUserForm.invalid;
  }

  ngAfterContentChecked() {
    this.cd.detectChanges();
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
    const confirm = 'Yes, delete.';
    this.popupService.openConfirm('Are you sure?', 'Are you sure you want to delete the user: ' + this.user.name , confirm, null, null)
    .subscribe((result: string) => {
      if (result === confirm) {
        alert('deleted');
      }
    });
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
