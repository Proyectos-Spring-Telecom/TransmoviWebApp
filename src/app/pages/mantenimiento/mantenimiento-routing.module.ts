import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaMantenimientoComponent } from './lista-mantenimiento/lista-mantenimiento.component';
import { MantenimientoVehicularComponent } from './mantenimientos/mantenimiento-vehicular/mantenimiento-vehicular.component';
import { MantenimientoCombustibleComponent } from './mantenimientos/mantenimiento-combustible/mantenimiento-combustible.component';
import { MantenimientoKilometrajeComponent } from './mantenimientos/mantenimiento-kilometraje/mantenimiento-kilometraje.component';
import { AgregarVehicularComponent } from './mantenimientos/mantenimiento-vehicular/agregar-vehicular/agregar-vehicular.component';
import { AgregarKilometrajeComponent } from './mantenimientos/mantenimiento-kilometraje/agregar-kilometraje/agregar-kilometraje.component';
import { AgregarCombustibleComponent } from './mantenimientos/mantenimiento-combustible/agregar-combustible/agregar-combustible.component';

const routes: Routes = [
  {
    path: '',
    component: ListaMantenimientoComponent,
  },
  {
    path: 'agregar-mantenimiento-vehicular',
    component: AgregarVehicularComponent,
  },
  {
    path: 'agregar-mantenimiento-kilometraje',
    component: AgregarKilometrajeComponent,
  },
  {
    path: 'agregar-mantenimiento-combustible',
    component: AgregarCombustibleComponent,
  },
  {
    path: 'editar-mantenimiento-vehicular/:idManVehicular',
    component: AgregarVehicularComponent,
  },
  {
    path: 'editar-mantenimiento-kilometraje/:idManKilometraje',
    component: AgregarKilometrajeComponent,
  },
  {
    path: 'editar-mantenimiento-combustible/:idManCombustible',
    component: AgregarCombustibleComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MantenimientoRoutingModule {}
