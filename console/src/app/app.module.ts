import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './core/app.component';
import { AppRoutingModule } from './app-routing.module';

import { UnsavedGuard } from './shared/guards/unsaved.guard';
import { SharedModule } from './shared/shared.module';
import { MapsService } from './maps/maps.service';
import { SocketService } from './shared/socket.service';
import { PluginsService } from './plugins/plugins.service';
import { AgentsService } from './agents/agents.service';
import { ProjectsService } from './projects/projects.service';
import { CalendarService } from './calendar/calendar.service';
import { CoreModule } from './core/core.module';


@NgModule({
  declarations: [

  ],
  imports: [
    CoreModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,

    AppRoutingModule,
  ],
  providers: [MapsService, PluginsService, AgentsService, ProjectsService, SocketService, CalendarService, UnsavedGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}
