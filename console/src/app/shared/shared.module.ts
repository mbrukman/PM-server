import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TreeTableModule, SharedModule as PrimeSharedModule, DataTableModule } from 'primeng/primeng';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { FilterPipe } from './filter.pipe';
import { TruncatecharsPipe } from './truncatechars.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatureComponent } from './feature/feature.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { InfiniteScrollDirective } from './infinite-scroll.directive';


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
    TooltipModule.forRoot()
  ],
  declarations: [
    FilterPipe,
    TruncatecharsPipe,
    FeatureComponent,
    ConfirmComponent,
    InfiniteScrollDirective
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
    ConfirmComponent,
    InfiniteScrollDirective
  ],
  entryComponents: [ConfirmComponent]
})
export class SharedModule {
}
