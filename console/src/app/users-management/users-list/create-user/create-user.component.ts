import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap';
import { User } from '@app/users-management/models/user.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {

  constructor(public bsModalRef: BsModalRef, private formBuilder: FormBuilder) {}

  public createUserForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: '',
    password: ['', [Validators.required, Validators.pattern('^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$')]],
    confirmPassword: ['', [Validators.required]],
    changePasswordOnNextLogin: false,
  }, {validator: this.checkPasswords });

  public onClose = new Subject<User>();

  get email() { return this.createUserForm.get('email'); }
  get password() { return this.createUserForm.get('password'); }
  get confirmPassword() { return this.createUserForm.get('confirmPassword'); }

  checkPasswords(group: FormGroup) {
    const password = group.get('password').value;
    const confirmPassword = group.get('confirmPassword').value;

    return password === confirmPassword ? null : { notSame: true };
  }

  onCreateUser() {
    this.onClose.next(this.createUserForm.value);
    this.bsModalRef.hide();
  }

}
