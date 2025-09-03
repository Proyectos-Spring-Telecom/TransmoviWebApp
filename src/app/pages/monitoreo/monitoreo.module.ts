import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitoreoRoutingModule } from './monitoreo-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapaComponent } from './mapa/mapa.component';


@NgModule({
  declarations: [MapaComponent],
  imports: [
    CommonModule,
    MonitoreoRoutingModule,
    ReactiveFormsModule,
    GoogleMapsModule,
  ]
})
export class MonitoreoModule { }
