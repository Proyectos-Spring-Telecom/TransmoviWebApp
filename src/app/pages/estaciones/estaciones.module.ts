import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EstacionesRoutingModule } from './estaciones-routing.module';
import { ListaEstacionesComponent } from './lista-estaciones/lista-estaciones.component';
import { GoogleMapsModule } from '@angular/google-maps';


@NgModule({
  declarations: [ListaEstacionesComponent],
  imports: [
    CommonModule,
    EstacionesRoutingModule,
    GoogleMapsModule
  ],
})
export class EstacionesModule { }
