import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustMatch } from '@app/shared/validators/must-match.validator';
import { passwordValidator } from '@app/shared/validators/password.validator';
import { User } from '@app/services/users/user.model';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {

  @Input() user: User;

  editUserForm: FormGroup;

  constructor(private formBuilder: FormBuilder) { }

  get form() { return this.editUserForm.controls; }

  private getInitialField(fieldName: string): string | boolean {
    if (this.user && this.user[fieldName]) {
      return this.user[fieldName];
    } else if (fieldName === 'changePasswordOnNextLogin') {
      return false;
    } else {
      return '';
    }
  }

  ngOnInit() {
    this.editUserForm = this.formBuilder.group({
      name: [this.getInitialField('name'), [Validators.required]],
      email: [this.getInitialField('email'), [Validators.required, Validators.email]],
      phoneNumber: this.getInitialField('phoneNumber'),
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      changePasswordOnNextLogin: this.getInitialField('changePasswordOnNextLogin'),
    }, { validator: MustMatch('password', 'confirmPassword') });
  }

}
