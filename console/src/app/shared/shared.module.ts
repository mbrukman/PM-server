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
import { LinebreakPipe } from './pipes/linebreak.pipe';
import { InlineEditDirective } from './directives/inline-edit.directive';
import { InPipe } from '@shared/pipes/filterIn.pipe';
import { RawOutputComponent } from './raw-output/raw-output.component';
import { AutoCompleteModule } from 'primeng/primeng';
import { ExecutionChartComponent } from '@shared/components/execution-chart/execution-chart.component';
import { MapsCardsComponents } from './map-cards/map-cards.component';
import { ParamsComponent } from './components/params/params.component';
import { OptionsParamComponent } from './components/params/options-param/options-param.component';
import { AutocompleteComponent } from './components/params/autocomplete/autocomplete.component';
import { AgentsGroupUpsertFilterComponent } from '@agents/groups/agents-group-upsert-filter/agents-group-upsert-filter.component';
import { EditAgentComponent } from '@agents/edit-agent/edit-agent.component';
import { InputPopupComponent } from '@agents/groups/input-popup/input-popup.component';
import { AgentsGroupUpsertComponent } from '@agents/agents-group-upsert/agents-group-upsertcomponent';
import { AddConfigurationComponent } from '@maps/map-detail/map-configurations/add-configuration/add-configuration.component';
import { SelectAgentComponent } from '@maps/map-detail/map-edit/map-enviroment-pane/map-agents/select-agent/select-agent.component';
import { TriggerFormComponent } from '@maps/map-detail/map-edit/map-enviroment-pane/map-triggers/trigger-form/trigger-form.component';
import { MapDuplicateComponent } from '@maps/map-detail/map-revisions/mapduplicate-popup/mapduplicate-popup.component';
import { PluginUploadComponent } from '@plugins/plugin-upload/plugin-upload.component';
import { ImportModalComponent } from '@projects/project-details/import-modal/import-modal.component';
import { UpsertVaultItemsComponent} from '../vault/upsert-vault-items/upsert-vault-items.component';
import { UserGroupCreateModalComponent } from '@app/users-management/iam-user-group/user-group-list/user-group-create-modal/user-group-create-modal.component';
import { ManagementTableComponent } from '../users-management/management-table/management-table.component';

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
    NgxChartsModule,
    AutoCompleteModule
  ],
  declarations: [
    FilterPipe,
    TruncatecharsPipe,
    FeatureComponent,
    ConfirmComponent,
    InlineEditDirective,
    LinebreakPipe,
    InPipe,
    EditAgentComponent,
    RawOutputComponent,
    MapsCardsComponents,
    ExecutionChartComponent,
    ParamsComponent,
    OptionsParamComponent,
    AgentsGroupUpsertFilterComponent,
    AutocompleteComponent,
    InputPopupComponent,
    AgentsGroupUpsertComponent,
    AddConfigurationComponent,
    SelectAgentComponent,
    TriggerFormComponent,
    MapDuplicateComponent,
    PluginUploadComponent,
    ImportModalComponent,
    UpsertVaultItemsComponent,
    UserGroupCreateModalComponent,
    ManagementTableComponent,

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
    InlineEditDirective,
    ConfirmComponent,
    LinebreakPipe,
    InPipe,
    MapsCardsComponents,
    ExecutionChartComponent,
    ParamsComponent,
    UserGroupCreateModalComponent,
    ManagementTableComponent
  ],
  entryComponents: [ConfirmComponent, RawOutputComponent, AgentsGroupUpsertFilterComponent, EditAgentComponent, InputPopupComponent, AgentsGroupUpsertComponent, AddConfigurationComponent, SelectAgentComponent, TriggerFormComponent, MapDuplicateComponent, PluginUploadComponent, ImportModalComponent, UpsertVaultItemsComponent, UserGroupCreateModalComponent]
})
export class SharedModule {
}
