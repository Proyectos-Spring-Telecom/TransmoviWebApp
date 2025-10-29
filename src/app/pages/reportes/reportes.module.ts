import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportesRoutingModule } from './reportes-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { RecaudacionDiariaRutaComponent } from './recaudacion-diaria-ruta/recaudacion-diaria-ruta.component';
import { RecaudacionOperadorComponent } from './recaudacion-operador/recaudacion-operador.component';
import { RecaudacionVehiculoComponent } from './recaudacion-vehiculo/recaudacion-vehiculo.component';
import { RecaudacionDipositivoInstalacionComponent } from './recaudacion-dipositivo-instalacion/recaudacion-dipositivo-instalacion.component';
import { RecaudacionDetalladasComponent } from './recaudacion-detalladas/recaudacion-detalladas.component';
import { ConteoPasajerosViajeComponent } from './conteo-pasajeros-viaje/conteo-pasajeros-viaje.component';


@NgModule({
  declarations: [
    RecaudacionDiariaRutaComponent,
    RecaudacionOperadorComponent,
    RecaudacionVehiculoComponent,
    RecaudacionDipositivoInstalacionComponent,
    RecaudacionDetalladasComponent,
    ConteoPasajerosViajeComponent
  ],
  imports: [
    CommonModule,
    ReportesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    DxSelectBoxModule,
    DxDateBoxModule
  ]
})
export class ReportesModule { }
