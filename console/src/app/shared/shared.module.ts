import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TreeTableModule, SharedModule as PrimeSharedModule, DataTableModule, DropdownModule } from 'primeng/primeng';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxChartsModule } from '@swimlane/ngx-charts';


import { FilterPipe } from './filter.pipe';
import { TruncatecharsPipe } from './truncatechars.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatureComponent } from './feature/feature.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { InfiniteScrollDirective } from './infinite-scroll.directive';
import { LinebreakPipe } from './linebreak.pipe';



@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TreeTableModule,
    PrimeSharedModule,
    DataTableModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    TooltipModule.forRoot(),
    DropdownModule,
    NgxChartsModule
  ],
  declarations: [
    FilterPipe,
    TruncatecharsPipe,
    FeatureComponent,
    ConfirmComponent,
    InfiniteScrollDirective,
    LinebreakPipe
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    FilterPipe,
    TruncatecharsPipe,
    FeatureComponent,
    TreeTableModule,
    PrimeSharedModule,
    DataTableModule,
    NgxChartsModule,
    DropdownModule,
    InfiniteScrollDirective,
    ConfirmComponent,
    LinebreakPipe
  ],
  entryComponents: [ConfirmComponent]
})
export class SharedModule {
}
