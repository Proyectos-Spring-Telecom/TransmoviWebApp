import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitoreoRoutingModule } from './monitoreo-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapaComponent } from './mapa/mapa.component';
import { DxSelectBoxModule, DxDateBoxModule } from 'devextreme-angular';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [MapaComponent],
  imports: [
    CommonModule,
    MonitoreoRoutingModule,
    ReactiveFormsModule,
    GoogleMapsModule,
    DxSelectBoxModule,
    DxDateBoxModule,
    NgbModalModule,
    FormsModule
  ]
})
export class MonitoreoModule { }
