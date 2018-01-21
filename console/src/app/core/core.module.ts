import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ToastyModule } from 'ng2-toasty';
import { AppComponent } from './app.component';
import { SearchComponent } from '../search/search.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    ToastyModule.forRoot(),
    BsDropdownModule,
    TooltipModule,
    SharedModule
  ],
  declarations: [
    AppComponent,
    SearchComponent,
    NotFoundComponent,
    DashboardComponent
  ],
  exports: [
    DashboardComponent
  ]
})
export class CoreModule { }
