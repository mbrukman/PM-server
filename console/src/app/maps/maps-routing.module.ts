import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapEditComponent } from './map-detail/map-edit/map-edit.component';
import { MapDesignComponent } from './map-detail/map-edit/map-design/map-design.component';
import { MapDetailComponent } from './map-detail/map-detail.component';
import { MapCodeComponent } from './map-detail/map-edit/map-code/map-code.component';
import { MapsListComponent } from './maps-list/maps-list.component';
import { MapRevisionsComponent } from './map-detail/map-revisions/map-revisions.component';
import { MapPropertiesComponent } from './map-detail/map-properties/map-properties.component';
import { UnsavedGuard } from '@shared/guards/unsaved.guard';
import { MapCreateComponent } from './map-create/map-create.component';
import { MapResultComponent } from './map-detail/map-result/map-result.component';
import { MapConfigurationsComponent } from "@maps/map-detail/map-configurations/map-configurations.component";
import { MapsResolver } from './maps-resolver.service';

const routes: Routes = [
  {
    path: '',
    component: MapsListComponent,
    pathMatch: 'full',
    resolve:{maps:MapsResolver}
  },

  {
    path: 'create',
    component: MapCreateComponent
  },
  {
    path: 'update',
    component: MapCreateComponent
  },
  {
    path: ':id',
    redirectTo: ':id/edit/design',
  },
  {
    path: ':id',
    component: MapDetailComponent,
    canDeactivate: [UnsavedGuard],
    children: [
      {
        path: 'properties',
        component: MapPropertiesComponent
      },
      {
        path: 'revisions',
        component: MapRevisionsComponent
      },
      {
        path: 'configurations',
        component: MapConfigurationsComponent
      },
      {
        path: 'edit',
        component: MapEditComponent,
        children: [
          {
            path: 'code',
            component: MapCodeComponent
          },
          {
            path: 'design',
            component: MapDesignComponent
          },
        ]
      },
      {
        path: 'results',
        component: MapResultComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapsRoutingModule { }
