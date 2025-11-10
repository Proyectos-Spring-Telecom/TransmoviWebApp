import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsuariosRoutingModule } from './usuarios-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { AltaUsuarioComponent } from './alta-usuario/alta-usuario.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ListaUsuariosComponent,
    AltaUsuarioComponent
  ],
  imports: [
    CommonModule,
    UsuariosRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class UsuariosModule { }
