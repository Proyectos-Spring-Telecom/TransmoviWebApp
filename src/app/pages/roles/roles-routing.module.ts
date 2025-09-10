import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaRolesComponent } from './lista-roles/lista-roles.component';
import { AltaRolesComponent } from './alta-roles/alta-roles.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaRolesComponent
  },
  { path: 'agregar-rol',
    component: AltaRolesComponent
  },
  {
    path: 'editar-rol/:idRol',
    component: AltaRolesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RolesRoutingModule { }
