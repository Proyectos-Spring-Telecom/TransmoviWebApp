import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DerroterosRoutingModule } from './derroteros-routing.module';
import { ListaDerroterosComponent } from './lista-derroteros/lista-derroteros.component';
import { AltaDerroteroComponent } from './alta-derrotero/alta-derrotero.component';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { GoogleMapsModule } from '@angular/google-maps';


@NgModule({
  declarations: [
    ListaDerroterosComponent,
    AltaDerroteroComponent
  ],
  imports: [
    CommonModule,
    DerroterosRoutingModule,
    GoogleMapsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class DerroterosModule { }
