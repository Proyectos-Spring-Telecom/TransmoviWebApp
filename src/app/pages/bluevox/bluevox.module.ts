import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BluevoxRoutingModule } from './bluevox-routing.module';
import { ListaBluevoxComponent } from './lista-bluevox/lista-bluevox.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxDateBoxModule, DxLoadPanelModule, DxValidatorModule } from 'devextreme-angular';
import { RegistrarComponent } from './registrar/registrar.component';
import { DispositivoBluevoxComponent } from './dispositivo-bluevox/dispositivo-bluevox.component';


@NgModule({
  declarations: [ListaBluevoxComponent, RegistrarComponent, DispositivoBluevoxComponent],
  imports: [
    CommonModule,
    BluevoxRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxDateBoxModule,
    DxValidatorModule
  ]
})
export class BluevoxModule { }
