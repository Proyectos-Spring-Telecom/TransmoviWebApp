import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehiculosRoutingModule } from './vehiculos-routing.module';
import { ListaVehiculosComponent } from './lista-vehiculos/lista-vehiculos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { AltaVehiculoComponent } from './alta-vehiculo/alta-vehiculo.component';


@NgModule({
  declarations: [ListaVehiculosComponent, AltaVehiculoComponent],
  imports: [
    CommonModule,
    VehiculosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule
  ]
})
export class VehiculosModule { }
