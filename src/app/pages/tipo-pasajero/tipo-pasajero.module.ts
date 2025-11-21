import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TipoPasajeroRoutingModule } from './tipo-pasajero-routing.module';
import { TipoPasajeroComponent } from './tipo-pasajero.component';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { AgregarTipoPasajeroComponent } from './agregar-tipo-pasajero/agregar-tipo-pasajero.component';


@NgModule({
  declarations: [TipoPasajeroComponent, AgregarTipoPasajeroComponent],
  imports: [
    CommonModule,
    TipoPasajeroRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class TipoPasajeroModule { }
