import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTurnosComponent } from './lista-turnos/lista-turnos.component';
import { AgregarTurnoComponent } from './agregar-turno/agregar-turno.component';

const routes: Routes = 
[
  { path: '',
    component: ListaTurnosComponent
  },
  { path: 'agregar-turno',
    component: AgregarTurnoComponent
  },
  {
    path: 'editar-turno/:idTurno',
    component: AgregarTurnoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnosRoutingModule { }
