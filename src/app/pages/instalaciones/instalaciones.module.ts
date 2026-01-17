import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InstalacionesRoutingModule } from './instalaciones-routing.module';
import { ListaInstalacionesComponent } from './lista-instalaciones/lista-instalaciones.component';
import { AltaInstalacionComponent } from './alta-instalacion/alta-instalacion.component';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule, DxTagBoxModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ListaInstalacionesComponent,
    AltaInstalacionComponent
  ],
  imports: [
    CommonModule,
    InstalacionesRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    DxSelectBoxModule,
    DxTagBoxModule
  ]
})
export class InstalacionesModule { }
