import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MantenimientoRoutingModule } from './mantenimiento-routing.module';
import { ListaMantenimientoComponent } from './lista-mantenimiento/lista-mantenimiento.component';

import { DxDataGridModule, DxDateBoxModule, DxDateRangeBoxModule, DxLoadPanelModule, DxSelectBoxModule, DxTabsModule } from 'devextreme-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { MantenimientoVehicularComponent } from './mantenimientos/mantenimiento-vehicular/mantenimiento-vehicular.component';
import { MantenimientoCombustibleComponent } from './mantenimientos/mantenimiento-combustible/mantenimiento-combustible.component';
import { MantenimientoKilometrajeComponent } from './mantenimientos/mantenimiento-kilometraje/mantenimiento-kilometraje.component';
import { AgregarVehicularComponent } from './mantenimientos/mantenimiento-vehicular/agregar-vehicular/agregar-vehicular.component';
import { AgregarKilometrajeComponent } from './mantenimientos/mantenimiento-kilometraje/agregar-kilometraje/agregar-kilometraje.component';
import { AgregarCombustibleComponent } from './mantenimientos/mantenimiento-combustible/agregar-combustible/agregar-combustible.component';

@NgModule({
  declarations: [
    ListaMantenimientoComponent,
    MantenimientoVehicularComponent,
    MantenimientoCombustibleComponent,
    MantenimientoKilometrajeComponent,
    AgregarVehicularComponent,
    AgregarKilometrajeComponent,
    AgregarCombustibleComponent
  ],
  imports: [
    CommonModule,
    MantenimientoRoutingModule,
    DxDataGridModule,
    DxLoadPanelModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    DxSelectBoxModule,
    DxTabsModule,
    DxSelectBoxModule,
    DxDateRangeBoxModule,
    DxDateBoxModule
  ]
})
export class MantenimientoModule { }
