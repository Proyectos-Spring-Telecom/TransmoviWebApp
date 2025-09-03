import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaPermisosComponent } from './lista-permisos/lista-permisos.component';
import { AltaPermisoComponent } from './alta-permiso/alta-permiso.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaPermisosComponent
  },
  { path: 'agregar-permiso',
    component: AltaPermisoComponent
  },
  {
    path: 'editar-permiso/:idPermiso',
    component: AltaPermisoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PermisosRoutingModule { }
