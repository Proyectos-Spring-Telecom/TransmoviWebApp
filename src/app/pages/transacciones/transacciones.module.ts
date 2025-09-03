import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransaccionesRoutingModule } from './transacciones-routing.module';
import { ListaTransaccionesComponent } from './lista-transacciones/lista-transacciones.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';


@NgModule({
  declarations: [ListaTransaccionesComponent],
  imports: [
    CommonModule,
    TransaccionesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    NgbModalModule,
    DxDataGridModule,
    DxLoadPanelModule
  ]
})
export class TransaccionesModule { }
