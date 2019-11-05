import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap';
import { User } from '@app/users-management/models/user.model';
import { Subject } from 'rxjs';
import { MustMatch } from '@app/shared/must-match.validator';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  createUserForm: FormGroup;

  constructor(public bsModalRef: BsModalRef, private formBuilder: FormBuilder) {}

  public onClose = new Subject<User>();

  get form() { return this.createUserForm.controls; }

  ngOnInit() {
    this.createUserForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: '',
      password: ['', [Validators.required, Validators.pattern('^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$')]],
      confirmPassword: ['', [Validators.required]],
      changePasswordOnNextLogin: false,
    }, {validator: MustMatch('password', 'confirmPassword') });
  }

  onCreateUser() {
    if (this.createUserForm.invalid) {
      throw new Error('Invalid form submission');
      return;
    }
    this.onClose.next(this.createUserForm.value);
    this.bsModalRef.hide();
  }

}
