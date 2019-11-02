import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from '@core/app.component';
import { AppRoutingModule } from './app-routing.module';

import { UnsavedGuard } from '@shared/guards/unsaved.guard';
import { SharedModule } from '@shared/shared.module';
import { CoreModule } from '@core/core.module';
import { IsSetUpGuard } from '@core/setup/issetup.guard';
import { KaholoHttpInterceptor } from './http-interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {IAMModule} from '@app/iam/iam.module';




@NgModule({
  imports: [
    CoreModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    AppRoutingModule,
    IAMModule
  ],
  providers: [
    UnsavedGuard,
    IsSetUpGuard,
    Title,
    { provide: HTTP_INTERCEPTORS, useClass: KaholoHttpInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
