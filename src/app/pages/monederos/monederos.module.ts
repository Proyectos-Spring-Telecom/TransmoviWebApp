import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonederosRoutingModule } from './monederos-routing.module';
import { ListaMonederosComponent } from './lista-monederos/lista-monederos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridModule, DxLoadPanelModule, DxSelectBoxModule } from 'devextreme-angular';
import { AgregarMonederoComponent } from './agregar-monedero/agregar-monedero.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaMonederosComponent, AgregarMonederoComponent],
  imports: [
    CommonModule,
    MonederosRoutingModule,
    FormsModule,
    NgbTooltipModule,
    NgbModalModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule,
    DxSelectBoxModule
  ]
})
export class MonederosModule { }
