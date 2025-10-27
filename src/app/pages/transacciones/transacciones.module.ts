import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransaccionesRoutingModule } from './transacciones-routing.module';
import { ListaTransaccionesComponent } from './lista-transacciones/lista-transacciones.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { AgregarTransaccionComponent } from './agregar-transaccion/agregar-transaccion.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaTransaccionesComponent, AgregarTransaccionComponent],
  imports: [
    CommonModule,
    TransaccionesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    NgbModalModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule
  ]
})
export class TransaccionesModule { }
