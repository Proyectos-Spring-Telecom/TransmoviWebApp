import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VerificacionesRoutingModule } from './verificaciones-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaVerificacionesComponent } from './lista-verificaciones/lista-verificaciones.component';
import { AgregarVerificacionComponent } from './agregar-verificacion/agregar-verificacion.component';


@NgModule({
  declarations: [ListaVerificacionesComponent, AgregarVerificacionComponent],
  imports: [
    CommonModule,
    VerificacionesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule,
    DxDateBoxModule
  ]
})
export class VerificacionesModule { }
