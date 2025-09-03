import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { AltaUsuarioComponent } from './alta-usuario/alta-usuario.component';

const routes: Routes = 
[
  { path: '',
    component: ListaUsuariosComponent
  },
  { path: 'agregar-usuario',
    component: AltaUsuarioComponent
  },
  {
    path: 'editar-usuario/:idUsuario',
    component: AltaUsuarioComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }
