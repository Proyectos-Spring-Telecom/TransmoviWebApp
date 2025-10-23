import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VistaPasajeroComponent } from './vista-pasajero.component';

const routes: Routes = [
  { 
    path: '',
    component:VistaPasajeroComponent
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VistaPasajeroRoutingModule { }
