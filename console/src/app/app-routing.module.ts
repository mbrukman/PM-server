import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { NotFoundComponent } from './core/not-found/not-found.component';

const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'maps/dashboard'
  },
  // maps
  {
    path: 'maps',
    loadChildren: './maps/maps.module#MapsModule'
  },
//  projects
  {
    path: 'projects',
    loadChildren: './projects/projects.module#ProjectsModule'
  },

//  admin
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule'
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
