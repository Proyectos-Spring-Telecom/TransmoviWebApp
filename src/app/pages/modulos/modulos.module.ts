import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModulosRoutingModule } from './modulos-routing.module';
import { ListaModulosComponent } from './lista-modulos/lista-modulos.component';
import { AltaModuloComponent } from './alta-modulo/alta-modulo.component';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaModulosComponent, AltaModuloComponent],
  imports: [
    CommonModule,
    ModulosRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class ModulosModule { }
