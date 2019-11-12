import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { passwordValidator } from '@app/shared/password.validator';
import { MustMatch } from '@app/shared/must-match.validator';
import { UserService } from '@app/services/users/user.service';
import { User } from '@app/services/users/user.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  formGroup: FormGroup;
  user: User;

  constructor(private formBuilder: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute, ) { }

  get form() { return this.formGroup.controls; }

  get formInvalid(): boolean {
    return this.formGroup.invalid;
  }

  ngOnInit() {
    // TODO: inject user based on auth token

    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
    }, { validator: MustMatch('password', 'confirmPassword') });
  }

  submit() {
    // TODO: auth
    this.userService.changeUserPassword(this.user._id, this.form['password'].value);
  }

}
