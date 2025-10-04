import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TarifasRoutingModule } from './tarifas-routing.module';
import { ListaTarifasComponent } from './lista-tarifas/lista-tarifas.component';
import { AgregarTarifaComponent } from './agregar-tarifa/agregar-tarifa.component';
import { FormModule } from '../form/form.module';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ListaTarifasComponent,
    AgregarTarifaComponent
  ],
  imports: [
    CommonModule,
    TarifasRoutingModule,
    FormModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule,
    ReactiveFormsModule
  ]
})
export class TarifasModule { }
