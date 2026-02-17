import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VistaPasajeroRoutingModule } from './vista-pasajero-routing.module';
import { VistaPasajeroComponent } from './vista-pasajero.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule, DxPopupModule } from 'devextreme-angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [VistaPasajeroComponent],
  imports: [
    CommonModule,
    VistaPasajeroRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxPopupModule,
    SharedModule,
    NgbModalModule
  ]
})
export class VistaPasajeroModule { }
