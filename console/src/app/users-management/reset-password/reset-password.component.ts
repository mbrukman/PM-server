import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { passwordValidator } from '@app/shared/password.validator';
import { MustMatch } from '@app/shared/must-match.validator';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  formGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) { }

  get form() { return this.formGroup.controls; }

  get formInvalid(): boolean {
    return this.formGroup.invalid;
  }

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
    }, {validator: MustMatch('password', 'confirmPassword') });
  }

  submit() {
    throw new Error('not implemented');
  }

}
