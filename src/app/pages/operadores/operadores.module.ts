import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OperadoresRoutingModule } from './operadores-routing.module';
import { ListaOperadoresComponent } from './lista-operadores/lista-operadores.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { AltaOperadorComponent } from './alta-operador/alta-operador.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaOperadoresComponent, AltaOperadorComponent],
  imports: [
    CommonModule,
    OperadoresRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule
  ]
})
export class OperadoresModule { }
