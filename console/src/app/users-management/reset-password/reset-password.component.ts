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

  /**
   * we need a JWT in the link here
   */
  token: string;

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
    this.token = this.route.snapshot.paramMap.get('token');

    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
    }, { validator: MustMatch('password', 'confirmPassword') });
  }

  submit() {
    // throw new Error('not implemented');
    this.userService.changeUserPassword(this.user._id, this.form['password'].value);
  }

}
