import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaVerificacionesComponent } from './lista-verificaciones/lista-verificaciones.component';
import { AgregarVerificacionComponent } from './agregar-verificacion/agregar-verificacion.component';

const routes: Routes =
  [
    {
      path: '',
      component: ListaVerificacionesComponent
    },
    {
      path: 'agregar-verificacion',
      component: AgregarVerificacionComponent
    },
    {
      path: 'editar-verificacion/:idVerificacion',
      component: AgregarVerificacionComponent,
    },
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VerificacionesRoutingModule { }
