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
export class CreateUserComponent implements OnInit {

  constructor(public bsModalRef: BsModalRef, private formBuilder: FormBuilder) {}

  public createUserForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: '',
    password: ['', [Validators.required, Validators.pattern('^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$')]],
    password2: ['', [Validators.required]]
  }, {validator: this.checkPasswords });

  public onClose = new Subject<User>();

  get email() { return this.createUserForm.get('email'); }
  get password() { return this.createUserForm.get('password'); }
  get password2() { return this.createUserForm.get('password2'); }

  checkPasswords(group: FormGroup) {
    const pass = group.get('password').value;
    const confirmPass = group.get('password2').value;

    return pass === confirmPass ? null : { notSame: true };
  }

  onCreateUser() {
    this.onClose.next(this.createUserForm.value);
    this.bsModalRef.hide();
  }

  ngOnInit() {
  }

}
