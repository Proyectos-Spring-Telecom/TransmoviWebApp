import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TalleresRoutingModule } from './talleres-routing.module';
import { ListaTalleresComponent } from './lista-talleres/lista-talleres.component';
import { AgregarTallerComponent } from './agregar-taller/agregar-taller.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ListaTalleresComponent,
    AgregarTallerComponent
  ],
  imports: [
    CommonModule,
    TalleresRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule
  ]
})
export class TalleresModule { }
