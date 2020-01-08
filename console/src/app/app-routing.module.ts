import {NgModule} from '@angular/core';
import {RouterModule, Routes, PreloadAllModules} from '@angular/router';

import {NotFoundComponent} from '@core/not-found/not-found.component';
import {DashboardComponent} from '@core/dashboard/dashboard.component';
import {SetupComponent} from '@core/setup/setup.component';
import {IsSetUpGuard} from '@core/setup/issetup.guard';
import {NgProgressModule} from '@ngx-progressbar/core';
import {NgProgressRouterModule} from '@ngx-progressbar/router';
import {DashboardResolver} from '@core/resolver/dashboard.resolver';
import {TosGuard} from '@shared/guards/tos/tos.guard';
import {TosComponent} from '@app/tos/tos.component';

const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    resolve: {dashboardItems: DashboardResolver},
    canActivate: [TosGuard, IsSetUpGuard]
  },
  {
    path: 'tos',
    component: TosComponent,
  },
  {
    path: 'setup',
    component: SetupComponent,
    canActivate: [TosGuard]
  },
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule',
    canActivate: [TosGuard, IsSetUpGuard]
  },
  // projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule',
    canActivate: [TosGuard, IsSetUpGuard]

  },
  // admin
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule',
    canActivate: [TosGuard, IsSetUpGuard]
  },
  {path: '**', component: NotFoundComponent, canActivate: [TosGuard]}

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
