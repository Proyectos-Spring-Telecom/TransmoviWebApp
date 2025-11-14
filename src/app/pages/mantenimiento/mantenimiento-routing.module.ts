import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaMantenimientoComponent } from './lista-mantenimiento/lista-mantenimiento.component';
import { MantenimientoVehicularComponent } from './mantenimientos/mantenimiento-vehicular/mantenimiento-vehicular.component';
import { MantenimientoCombustibleComponent } from './mantenimientos/mantenimiento-combustible/mantenimiento-combustible.component';
import { MantenimientoKilometrajeComponent } from './mantenimientos/mantenimiento-kilometraje/mantenimiento-kilometraje.component';

const routes: Routes = [
  {
    path: '',
    component: ListaMantenimientoComponent,
    children: [
      {
        path: 'vehicular',
        component: MantenimientoVehicularComponent
      },
      {
        path: 'combustible',
        component: MantenimientoCombustibleComponent
      },
      {
        path: 'kilometraje',
        component: MantenimientoKilometrajeComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'vehicular'
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MantenimientoRoutingModule { }
