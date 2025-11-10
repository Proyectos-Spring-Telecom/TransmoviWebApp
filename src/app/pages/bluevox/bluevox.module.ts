import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BluevoxRoutingModule } from './bluevox-routing.module';
import { ListaBluevoxComponent } from './lista-bluevox/lista-bluevox.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxSelectBoxModule, DxValidatorModule } from 'devextreme-angular';
import { RegistrarComponent } from './registrar/registrar.component';
import { DispositivoBluevoxComponent } from './dispositivo-bluevox/dispositivo-bluevox.component';
import { RegistrarBluevoxComponent } from './registrar-bluevox/registrar-bluevox.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaBluevoxComponent, RegistrarComponent, DispositivoBluevoxComponent, RegistrarBluevoxComponent],
  imports: [
    CommonModule,
    BluevoxRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxDateBoxModule,
    DxValidatorModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class BluevoxModule { }
