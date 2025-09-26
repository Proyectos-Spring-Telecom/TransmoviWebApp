import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientesRoutingModule } from './clientes-routing.module';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { AltaClientesComponent } from './alta-clientes/alta-clientes.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaClientesComponent, AltaClientesComponent],
  imports: [
    CommonModule,
    ClientesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule
  ]
})
export class ClientesModule { }
