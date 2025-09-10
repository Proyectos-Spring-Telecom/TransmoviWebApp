import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles-routing.module';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ListaRolesComponent } from './lista-roles/lista-roles.component';
import { AltaRolesComponent } from './alta-roles/alta-roles.component';


@NgModule({
  declarations: [
    ListaRolesComponent,
    AltaRolesComponent
  ],
  imports: [
    CommonModule,
    RolesRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule
  ]
})
export class RolesModule { }
