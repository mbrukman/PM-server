import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { NotFoundComponent } from '@core/not-found/not-found.component';
import { DashboardComponent } from '@core/dashboard/dashboard.component';
import { IsSetUpGuard } from '@core/setup/issetup.guard';
import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressRouterModule } from '@ngx-progressbar/router';
import { DashboardResolver } from '@core/resolver/dashboard.resolver';
import { ResetPasswordComponent } from '@core/auth/reset-password/reset-password.component';
import { LoginComponent } from '@core/auth/login/login.component';
import { AuthGuard } from '@core/auth/auth.guard';

const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    resolve: { dashboardItems: DashboardResolver },
    canActivate: [IsSetUpGuard, AuthGuard]
  },
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule',
    canActivate: [IsSetUpGuard, AuthGuard]
  },
  // projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule',
    canActivate: [IsSetUpGuard, AuthGuard]

  },
  // admin
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule',
    canActivate: [IsSetUpGuard, AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', component: NotFoundComponent }
];


@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { preloadingStrategy: PreloadAllModules }),
    NgProgressModule,
    NgProgressRouterModule,
  ],
  exports: [
    RouterModule
  ],
})
export class AppRoutingModule {
}
