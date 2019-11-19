import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { passwordValidator } from '@app/shared/validators/password.validator';
import { MustMatch } from '@app/shared/validators/must-match.validator';
import { UserService } from '@app/services/users/user.service';
import { User } from '@app/services/users/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  private mainSubscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) { }

  get form() {
    return this.formGroup.controls;
  }

  get formInvalid(): boolean {
    return this.formGroup.invalid;
  }

  ngOnInit() {
    this.formGroup = this.formBuilder.group(
      {
        password: ['', [Validators.required, passwordValidator]],
        confirmPassword: ['', [Validators.required]]
      },
      { validator: MustMatch('password', 'confirmPassword') }
    );
  }

  submit() {
    if (!this.formInvalid) {
      this.mainSubscription.add(
        this.userService
          .resetPassword(this.form['password'].value)
          .subscribe(
            user => {
              if (user) {
                this.router.navigateByUrl('/');
              }
            },
            err => {
              console.error('Error resetting password:', err);
              throw err;
            }
          )
      );
    }
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
