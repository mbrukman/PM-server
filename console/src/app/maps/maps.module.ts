import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonacoEditorModule } from 'ngx-monaco-editor';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { SharedModule } from '../shared/shared.module';

import { MapsRoutingModule } from './maps-routing.module';
import { MapTriggersComponent } from './map-detail/map-edit/map-enviroment-pane/map-triggers/map-triggers.component';
import { AddAttributeComponent } from './map-detail/map-edit/map-enviroment-pane/map-attributes/add-attribute/add-attribute.component';
import { MapDesignComponent } from './map-detail/map-edit/map-design/map-design.component';
import { MapDetailComponent } from './map-detail/map-detail.component';
import { MapsListComponent } from './maps-list/maps-list.component';
import { SelectAgentComponent } from './map-detail/map-edit/map-enviroment-pane/map-agents/select-agent/select-agent.component';
import { TriggerFormComponent } from './map-detail/map-edit/map-enviroment-pane/map-triggers/trigger-form/trigger-form.component';
import { MapEditComponent } from './map-detail/map-edit/map-edit.component';
import { MapAgentsComponent } from './map-detail/map-edit/map-enviroment-pane/map-agents/map-agents.component';
import { MapAttributesComponent } from './map-detail/map-edit/map-enviroment-pane/map-attributes/map-attributes.component';
import { MapCodeComponent } from './map-detail/map-edit/map-code/map-code.component';
import { MapRevisionsComponent } from './map-detail/map-revisions/map-revisions.component';
import { ProcessFormComponent } from './map-detail/map-edit/map-design/process-form/process-form.component';
import { MapPropertiesComponent } from './map-detail/map-properties/map-properties.component';
import { PluginToolboxComponent } from './map-detail/map-edit/map-enviroment-pane/plugin-toolbox/plugin-toolbox.component';
import { MapCreateComponent } from './map-create/map-create.component';
import { MapEnvironmentPaneComponent } from './map-detail/map-edit/map-enviroment-pane/map-environment-pane.component';
import { MapResultComponent } from './map-detail/map-result/map-result.component';
import { ProcessResultComponent } from './map-detail/map-result/process-result/process-result.component';


@NgModule({
  imports: [
    CommonModule,
    MapsRoutingModule,
    SharedModule,
    MonacoEditorModule.forRoot(),
    BsDropdownModule,
    ModalModule,
    AccordionModule,
    TooltipModule
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
    MapAttributesComponent,
    AddAttributeComponent,
    MapTriggersComponent,
    TriggerFormComponent,
    ProcessFormComponent,
    PluginToolboxComponent,
    MapResultComponent,
    ProcessResultComponent
  ],
  entryComponents: [SelectAgentComponent, AddAttributeComponent, TriggerFormComponent]
})
export class MapsModule { }
