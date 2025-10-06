import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnosRoutingModule } from './turnos-routing.module';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaTurnosComponent } from './lista-turnos/lista-turnos.component';
import { AgregarTurnoComponent } from './agregar-turno/agregar-turno.component';


@NgModule({
  declarations: [
    ListaTurnosComponent,
    AgregarTurnoComponent
  ],
  imports: [
    CommonModule,
    TurnosRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class TurnosModule { }
