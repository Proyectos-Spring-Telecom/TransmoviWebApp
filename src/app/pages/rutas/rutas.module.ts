import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutasRoutingModule } from './rutas-routing.module';
import { ListaRutasComponent } from './lista-rutas/lista-rutas.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DxDataGridModule, DxLoadPanelModule } from 'devextreme-angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { AgregarRutaComponent } from './agregar-ruta/agregar-ruta.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [ListaRutasComponent, AgregarRutaComponent],
  imports: [
    CommonModule,
    RutasRoutingModule,
    GoogleMapsModule,
    NgbModalModule,
    FormsModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxLoadPanelModule,
    SharedModule
  ]
})
export class RutasModule { }
