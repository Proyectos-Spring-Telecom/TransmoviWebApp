import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViajesRoutingModule } from './viajes-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxPopupModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaViajesComponent } from './lista-viajes/lista-viajes.component';


@NgModule({
  declarations: [ListaViajesComponent],
  imports: [
    CommonModule,
    ViajesRoutingModule,
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
export class ViajesModule { }
