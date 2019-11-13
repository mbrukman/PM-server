import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '@app/services/auth.service';
import { User } from '@app/services/users/user.model';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  email: string;
  password: string;
  errorMessage: string;
  subscription: Subscription;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {

  }

  login() {
    this.subscription = this.authService.login(this.email, this.password)
      .subscribe(
        (user: User) => {
          console.log('User logged in:', user);
          this.router.navigateByUrl('/');
        },
        (error: HttpErrorResponse) => {
          console.error(error);
          if (error.status === 0) {
            this.errorMessage = 'Error connecting to server.';
            return;
          }
          this.errorMessage = error.message;
        }
      );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
