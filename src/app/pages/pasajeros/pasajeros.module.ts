import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PasajerosRoutingModule } from './pasajeros-routing.module';
import { ListaPasajerosComponent } from './lista-pasajeros/lista-pasajeros.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { AltaPasajeroComponent } from './alta-pasajero/alta-pasajero.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaPasajerosComponent, AltaPasajeroComponent],
  imports: [
    CommonModule,
    PasajerosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule
  ]
})
export class PasajerosModule { }
