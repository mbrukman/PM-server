import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DataTableModule, DropdownModule, SharedModule as PrimeSharedModule, TreeTableModule } from 'primeng/primeng';
import { DragDropModule } from 'primeng/dragdrop';
import { AccordionModule as PMAccordionModule } from 'primeng/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { FilterPipe } from './pipes/filter.pipe';
import { TruncatecharsPipe } from './truncatechars.pipe';
import { FeatureComponent } from './feature/feature.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';
import { LinebreakPipe } from './pipes/linebreak.pipe';
import { InlineEditDirective } from './directives/inline-edit.directive';
import { InPipe } from '@shared/pipes/filterIn.pipe';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TreeTableModule,
    PrimeSharedModule,
    DataTableModule,
    DragDropModule,
    PMAccordionModule,
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
    InlineEditDirective,
    LinebreakPipe,
    InPipe
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    FilterPipe,
    TruncatecharsPipe,
    FeatureComponent,
    TreeTableModule,
    PMAccordionModule,
    DragDropModule,
    PrimeSharedModule,
    DataTableModule,
    NgxChartsModule,
    DropdownModule,
    InfiniteScrollDirective,
    InlineEditDirective,
    ConfirmComponent,
    LinebreakPipe,
    InPipe
  ],
  entryComponents: [ConfirmComponent]
})
export class SharedModule {
}
