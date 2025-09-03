import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { DxFileUploaderModule, 
  DxButtonModule,
  DxDataGridModule,
  DxDropDownBoxModule, 
  DxFormModule,
  DxTextAreaModule,
  DxPopoverModule, 
  DxPopupModule, 
  DxSelectBoxModule, 
  DxTemplateModule,
  DxDateRangeBoxModule,
  DxTreeListModule,DxChartModule,
  DxLoadIndicatorModule,
  DxTreeMapModule,
  DxValidatorModule,
  DxTextBoxModule,
  DxTagBoxModule,
  DxValidationSummaryModule, 
  DxScrollViewModule } from 'devextreme-angular';

import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment';

import { NgbNavModule, NgbAccordionModule, NgbTooltipModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CarouselModule } from 'ngx-owl-carousel-o';

import { LayoutsModule } from './layouts/layouts.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { initFirebaseBackend } from './authUtils';
import { ErrorInterceptor } from './core/helpers/error.interceptor';
import { JwtInterceptor } from './core/helpers/jwt.interceptor';
import { FakeBackendInterceptor } from './core/helpers/fake-backend';
import { AuthModule } from './account/auth/auth.module';
import { InterceptService } from './account/auth/login/intercept.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgxPermissionsModule } from 'ngx-permissions';

import { DxoColorizerModule, DxoSizeModule, DxoTitleModule } from 'devextreme-angular/ui/nested';
import { locale, loadMessages } from "devextreme/localization"; // Importa localización
export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
  ],
  imports: [
    NgxPermissionsModule.forRoot(),
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    BrowserAnimationsModule,
    HttpClientModule,
    DxFileUploaderModule, 
    DxButtonModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxFormModule,
    DxTextAreaModule,
    DxPopoverModule, 
    DxPopupModule,
    DxDateRangeBoxModule,
    DxSelectBoxModule,
    DxoTitleModule,
    DxoColorizerModule,
    DxoSizeModule,
    DxTemplateModule, 
    DxTreeListModule,
    DxChartModule,
    DxLoadIndicatorModule,
    DxTreeMapModule,
    DxValidatorModule,
    DxTextBoxModule,
    DxTagBoxModule,
    DxValidationSummaryModule, 
    DxScrollViewModule, // Aquí está la importación del módulo DxDataGridModule
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    LayoutsModule,
    AppRoutingModule,
    CarouselModule,
    NgbAccordionModule,
    NgbNavModule,
    NgbTooltipModule,
    NgbModule,
    AuthModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right', // Ajusta según necesites: 'toast-top-right', 'toast-bottom-right', 'toast-top-left', 'toast-bottom-left', 'toast-top-full-width', 'toast-bottom-full-width', 'toast-top-center', 'toast-bottom-center'
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      timeOut: 5000, // Ajusta el tiempo que el toastr permanece visible
    }),
  ],
  bootstrap: [AppComponent],
/*  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: FakeBackendInterceptor, multi: true },
  ],
*/
providers: [
  DatePipe,
  { provide: HTTP_INTERCEPTORS, useClass: InterceptService, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },


],
})
export class AppModule { constructor() {
  // Carga los mensajes en español
  loadMessages({
    "es": {
      "dxDataGrid-groupContinuesMessage": "Continúa en la siguiente página",
      "dxDataGrid-groupContinuedMessage": "Continúa desde la página anterior",
      // Otros textos personalizados
    }
  });

  // Configura el idioma español
  locale("es");
} }
