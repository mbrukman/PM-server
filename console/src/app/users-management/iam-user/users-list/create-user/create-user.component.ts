import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';
import { User } from '@app/services/users/user.model';
import { EditUserComponent } from '@app/users-management/iam-user/users-list/edit-user/edit-user.component';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  @ViewChild(EditUserComponent)
  private editUserComponent: EditUserComponent;

  constructor(public bsModalRef: BsModalRef) {}

  public onClose = new Subject<User>();

  get formInvalid(): boolean {
    return this.editUserComponent.editUserForm.invalid;
  }

  ngOnInit() {}

  onCreateUser() {
    if (this.formInvalid) {
      throw new Error('Invalid form submission');
    }
    this.onClose.next(this.editUserComponent.editUserForm.value);
    this.bsModalRef.hide();
  }

}
