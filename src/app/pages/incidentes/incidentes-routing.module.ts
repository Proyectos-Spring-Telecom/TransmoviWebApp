import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaIncidentesComponent } from './lista-incidentes/lista-incidentes.component';
import { AgregarIncidenteComponent } from './agregar-incidente/agregar-incidente.component';

const routes: Routes =
  [
    {
      path: '',
      component: ListaIncidentesComponent
    },
    {
      path: 'agregar-Incidente',
      component: AgregarIncidenteComponent
    },
    {
      path: 'editar-Incidente/:idIncidente',
      component: AgregarIncidenteComponent,
    },
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IncidentesRoutingModule { }
