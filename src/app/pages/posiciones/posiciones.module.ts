import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PosicionesRoutingModule } from './posiciones-routing.module';
import { ListaPosicionesComponent } from './lista-posiciones/lista-posiciones.component';
import { FormModule } from '../form/form.module';
import { PermisosRoutingModule } from '../permisos/permisos-routing.module';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaPosicionesComponent],
  imports: [
    CommonModule,
    PosicionesRoutingModule,
    FormModule,
    PermisosRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class PosicionesModule { }
