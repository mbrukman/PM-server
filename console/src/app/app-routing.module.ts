import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { NotFoundComponent } from './core/not-found/not-found.component';
import { DashboardComponent } from './core/dashboard/dashboard.component';
import { SetupComponent } from './core/setup/setup.component';
import { IsSetUpGuard } from './core/setup/issetup.guard';
import { MapsModule } from './maps/maps.module';
export function getMapsModule(){return MapsModule}


const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [IsSetUpGuard]
  },
  {
    path: 'setup',
    component: SetupComponent
  },
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule',
    canActivate: [IsSetUpGuard]
  },
  // projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule',
    canActivate: [IsSetUpGuard]

  },
  // admin
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule',
    canActivate: [IsSetUpGuard]
  },
  { path: '**', component: NotFoundComponent }

];


@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
