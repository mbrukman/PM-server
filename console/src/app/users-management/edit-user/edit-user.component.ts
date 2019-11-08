import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustMatch } from '@app/shared/must-match.validator';
import { User } from '@app/services/users/user.model';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {

  editUserForm: FormGroup;

  // @Output() submitForm: EventEmitter<User> = new EventEmitter();

  constructor(private formBuilder: FormBuilder) { }

  get form() { return this.editUserForm.controls; }

  ngOnInit() {
    this.editUserForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: '',
      password: ['', [Validators.required, Validators.pattern('^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$')]],
      confirmPassword: ['', [Validators.required]],
      changePasswordOnNextLogin: false,
    }, {validator: MustMatch('password', 'confirmPassword') });
  }

}
