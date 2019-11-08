import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';
import { User } from '@app/services/users/user.model';
import { EditUserComponent } from '@app/users-management/edit-user/edit-user.component';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  @ViewChild(EditUserComponent, {static: false})
  private editUserComponent: EditUserComponent;

  constructor(public bsModalRef: BsModalRef) {}

  public onClose = new Subject<User>();

  ngOnInit() {}

  onCreateUser() {
    // if (this.createUserForm.invalid) {
    //   throw new Error('Invalid form submission');
    //   return;
    // }
    // this.onClose.next(this.createUserForm.value);
    // this.bsModalRef.hide();
  }

}
