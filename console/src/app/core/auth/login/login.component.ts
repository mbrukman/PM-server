import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '@app/services/auth.service';
import { User } from '@app/services/users/user.model';
import { Router, ActivatedRoute } from '@angular/router';
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
  mainSubscription = new Subscription();
  keepLoggedIn: boolean;
  returnUrl: string;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    // redirect to home if token exists
    if (AuthService.token) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  login() {
    this.mainSubscription.add(this.authService.login(this.email, this.password, this.keepLoggedIn)
      .subscribe(
        (user: User) => {
          if (user) {
            this.router.navigateByUrl('/');
          } else {
            throw new Error('No user returned for server');
          }
        },
        (error: HttpErrorResponse) => {
          console.error(error);
          if (error.status === 0) {
            this.errorMessage = 'Error connecting to server.';
            return;
          }
          this.errorMessage = error.message || error.name;
        }
      ));
  }

  ngOnDestroy(): void {
    this.mainSubscription.unsubscribe();
  }
}
