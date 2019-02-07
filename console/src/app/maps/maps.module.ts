import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG} from 'ngx-monaco-editor';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxDnDModule } from '@swimlane/ngx-dnd';

import { SharedModule } from '@shared/shared.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MapsRoutingModule } from './maps-routing.module';
import { MapTriggersComponent } from './map-detail/map-edit/map-enviroment-pane/map-triggers/map-triggers.component';
import { MapDesignComponent } from './map-detail/map-edit/map-design/map-design.component';
import { MapDetailComponent } from './map-detail/map-detail.component';
import { MapsListComponent } from './maps-list/maps-list.component';
import { SelectAgentComponent } from './map-detail/map-edit/map-enviroment-pane/map-agents/select-agent/select-agent.component';
import { TriggerFormComponent } from './map-detail/map-edit/map-enviroment-pane/map-triggers/trigger-form/trigger-form.component';
import { MapEditComponent } from './map-detail/map-edit/map-edit.component';
import { MapAgentsComponent } from './map-detail/map-edit/map-enviroment-pane/map-agents/map-agents.component';
import { MapCodeComponent } from './map-detail/map-edit/map-code/map-code.component';
import { MapRevisionsComponent } from './map-detail/map-revisions/map-revisions.component';
import { ProcessFormComponent } from './map-detail/map-edit/map-design/process-form/process-form.component';
import { MapPropertiesComponent } from './map-detail/map-properties/map-properties.component';
import { PluginToolboxComponent } from './map-detail/map-edit/map-enviroment-pane/plugin-toolbox/plugin-toolbox.component';
import { MapCreateComponent } from './map-create/map-create.component';
import { MapEnvironmentPaneComponent } from './map-detail/map-edit/map-enviroment-pane/map-environment-pane.component';
import { MapResultComponent } from './map-detail/map-result/map-result.component';
import { ProcessResultComponent } from './map-detail/map-result/process-result/process-result.component';
import { ProcessListItemComponent } from './map-detail/map-result/process-list-item/process-list-item.component';
import { MapConfigurationsComponent } from './map-detail/map-configurations/map-configurations.component';
import { AddConfigurationComponent } from './map-detail/map-configurations/add-configuration/add-configuration.component';
import { ProcessViewComponent } from './map-detail/map-revisions/process-view/process-view.component';
import { MapDuplicateComponent } from '@maps/map-detail/map-revisions/mapduplicate-popup/mapduplicate-popup.component';
import { monacoConfig } from './monaco-config' 

@NgModule({
  imports: [
    CommonModule,
    MapsRoutingModule,
    SharedModule,
    MonacoEditorModule.forRoot(monacoConfig),
    BsDropdownModule,
    ModalModule,
    AccordionModule,
    TooltipModule,
    NgxDnDModule,
    InfiniteScrollModule
  ],
  declarations: [
    MapDetailComponent,
    MapPropertiesComponent,
    MapDesignComponent,
    MapCodeComponent,
    MapEditComponent,
    MapsListComponent,
    MapCreateComponent,
    MapEnvironmentPaneComponent,
    MapAgentsComponent,
    MapRevisionsComponent,
    SelectAgentComponent,
    MapConfigurationsComponent,
    MapTriggersComponent,
    TriggerFormComponent,
    ProcessFormComponent,
    PluginToolboxComponent,
    MapResultComponent,
    ProcessResultComponent,
    ProcessListItemComponent,
    AddConfigurationComponent,
    ProcessViewComponent,
    MapDuplicateComponent,
  ],
  entryComponents: [SelectAgentComponent, TriggerFormComponent, AddConfigurationComponent,MapDuplicateComponent]
})
export class MapsModule {}
