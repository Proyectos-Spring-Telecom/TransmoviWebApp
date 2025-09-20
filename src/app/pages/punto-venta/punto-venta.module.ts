import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PuntoVentaRoutingModule } from './punto-venta-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FormModule } from '../form/form.module';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { PuntoVentaPostComponent } from './punto-venta-post/punto-venta-post.component';


@NgModule({
  declarations: [PuntoVentaPostComponent],
  imports: [
    CommonModule,
    PuntoVentaRoutingModule,
    ReactiveFormsModule,
    FormModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class PuntoVentaModule { }
