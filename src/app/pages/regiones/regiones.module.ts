import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegionesRoutingModule } from './regiones-routing.module';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaRegionesComponent } from './lista-regiones/lista-regiones.component';
import { AltaRegionComponent } from './alta-region/alta-region.component';


@NgModule({
  declarations: [
    ListaRegionesComponent,
    AltaRegionComponent
  ],
  imports: [
    CommonModule,
    RegionesRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class RegionesModule { }
