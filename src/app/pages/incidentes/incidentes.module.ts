import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IncidentesRoutingModule } from './incidentes-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { AgregarIncidenteComponent } from './agregar-incidente/agregar-incidente.component';
import { ListaIncidentesComponent } from './lista-incidentes/lista-incidentes.component';


@NgModule({
  declarations: [ListaIncidentesComponent,
AgregarIncidenteComponent],
  imports: [
    CommonModule,
    IncidentesRoutingModule,
    FormsModule,
        ReactiveFormsModule,
        DxDataGridModule,
        DxLoadPanelModule,
        SharedModule,
        DxSelectBoxModule,
        DxDateBoxModule,
        DxPopupModule
  ]
})
export class IncidentesModule { }
