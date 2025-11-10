import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DispositivosRoutingModule } from './dispositivos-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListaDispositivosComponent } from './lista-dispositivos/lista-dispositivos.component';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { AltaDispositivoComponent } from './alta-dispositivo/alta-dispositivo.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaDispositivosComponent, AltaDispositivoComponent],
  imports: [
    CommonModule,
    DispositivosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class DispositivosModule { }
