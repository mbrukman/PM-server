import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { passwordValidator } from '@app/shared/password.validator';
import { MustMatch } from '@app/shared/must-match.validator';
import { UserService } from '@app/services/users/user.service';
import { User } from '@app/services/users/user.model';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

  formGroup: FormGroup;
  private mainSubscription = new Subscription();

  constructor(private formBuilder: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute, ) { }

  get form() { return this.formGroup.controls; }

  get formInvalid(): boolean {
    return this.formGroup.invalid;
  }

  ngOnInit() {
    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]],
    }, { validator: MustMatch('password', 'confirmPassword') });
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }

  submit() {
    if (!this.formInvalid) {
      this.mainSubscription.add(
        this.userService.changeUserPassword(this.form['password'].value)
          .subscribe(success => {
            if (success === true) {
              // TODO: redirect to dashboard
            }
          }));
    }
  }

}
