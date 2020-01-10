import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { NotFoundComponent } from '@core/not-found/not-found.component';
import { DashboardComponent } from '@core/dashboard/dashboard.component';
import { SetupComponent } from '@core/setup/setup.component';
import { IsSetUpGuard } from '@core/setup/issetup.guard';
import { NgProgressModule } from '@ngx-progressbar/core';
import { NgProgressRouterModule } from '@ngx-progressbar/router';
import { DashboardResolver } from '@core/resolver/dashboard.resolver';
import { TermsOfUseGuard } from '@shared/guards/terms-of-use/terms-of-use.guard';
import { TermsOfUseComponent } from '@app/terms-of-use/terms-of-use.component';

const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    resolve: {dashboardItems: DashboardResolver},
    canActivate: [TermsOfUseGuard, IsSetUpGuard]
  },
  {
    path: 'terms-of-use',
    component: TermsOfUseComponent,
  },
  {
    path: 'setup',
    component: SetupComponent,
    canActivate: [TermsOfUseGuard]
  },
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule',
    canActivate: [TermsOfUseGuard, IsSetUpGuard]
  },
  // projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule',
    canActivate: [TermsOfUseGuard, IsSetUpGuard]

  },
  // admin
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule',
    canActivate: [TermsOfUseGuard, IsSetUpGuard]
  },
  {path: '**', component: NotFoundComponent, canActivate: [TermsOfUseGuard]}

];


@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {preloadingStrategy: PreloadAllModules}),
    NgProgressModule,
    NgProgressRouterModule
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
