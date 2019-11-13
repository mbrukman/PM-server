import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ToastyModule } from 'ng2-toasty';
import { AppComponent } from './app.component';
import { SearchComponent } from '../search/search.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SetupComponent } from './setup/setup.component';
import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressRouterModule } from '@ngx-progressbar/router';
import { DashboardResolver } from '@core/resolver/dashboard.resolver';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { LoginComponent } from './auth/login/login.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ToastyModule.forRoot(),
    BsDropdownModule,
    TooltipModule,
    SharedModule,
    NgProgressModule,
    NgProgressRouterModule
  ],
  declarations: [
    AppComponent,
    SearchComponent,
    NotFoundComponent,
    DashboardComponent,
    SetupComponent,
    ResetPasswordComponent,
    LoginComponent
  ],
  exports: [
    DashboardComponent,
    SetupComponent,
    ResetPasswordComponent,
  ],
  providers: [DashboardResolver]
})
export class CoreModule {
}
