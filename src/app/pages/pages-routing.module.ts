import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DefaultComponent } from './dashboards/default/default.component';
import { CalendarComponent } from './calendar/calendar.component';
import { ChatComponent } from './chat/chat.component';
import { FileManagerComponent } from './file-manager/file-manager.component';
import { ListaBitacoraComponent } from './bitacora/lista-bitacora/lista-bitacora.component';

const routes: Routes = [
  // { path: '', redirectTo: 'dashboard' },
  { path: '', component: DefaultComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'file-manager',component:FileManagerComponent},
  { path: 'dashboards', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule) },
  { path: 'ecommerce', loadChildren: () => import('./ecommerce/ecommerce.module').then(m => m.EcommerceModule) },
  { path: 'email', loadChildren: () => import('./email/email.module').then(m => m.EmailModule) },
  { path: 'invoices', loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule) },
  { path: 'contacts', loadChildren: () => import('./contacts/contacts.module').then(m => m.ContactsModule) },
  { path: 'ui', loadChildren: () => import('./ui/ui.module').then(m => m.UiModule) },  
  { path: 'form', loadChildren: () => import('./form/form.module').then(m => m.FormModule) },

  { path: 'dispositivos', loadChildren: () => import('./dispositivos/dispositivos.module').then(m => m.DispositivosModule)},
  { path: 'vehiculos', loadChildren: () => import('./vehiculos/vehiculos.module').then(m => m.VehiculosModule)},
  { path: 'operadores', loadChildren: () => import('./operadores/operadores.module').then(m => m.OperadoresModule)},
  { path: 'monederos', loadChildren: () => import('./monederos/monederos.module').then(m => m.MonederosModule)},
  { path: 'pasajeros', loadChildren: () => import('./pasajeros/pasajeros.module').then(m => m.PasajerosModule)},
  { path: 'transacciones', loadChildren: () => import('./transacciones/transacciones.module').then(m => m.TransaccionesModule)},
  { path: 'bitacora', loadChildren: () => import('./bitacora/bitacora.module').then(m => m.BitacoraModule)},
  { path: 'rutas', loadChildren: () => import('./rutas/rutas.module').then(m => m.RutasModule)},
  { path: 'bluevox', loadChildren: () => import('./bluevox/bluevox.module').then(m => m.BluevoxModule)},
  { path: 'monitoreo', loadChildren: () => import('./monitoreo/monitoreo.module').then(m => m.MonitoreoModule)},
  { path: 'clientes', loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesModule)},
  { path: 'usuarios', loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosModule)},
  { path: 'permisos', loadChildren: () => import('./permisos/permisos.module').then(m => m.PermisosModule)},
  { path: 'modulos', loadChildren: () => import('./modulos/modulos.module').then(m => m.ModulosModule)},
  { path: 'roles', loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule)},
  { path: 'punto-venta', loadChildren: () => import('./punto-venta/punto-venta.module').then(m => m.PuntoVentaModule)},
  { path: 'instalaciones', loadChildren: () => import('./instalaciones/instalaciones.module').then(m => m.InstalacionesModule)},
  { path: 'regiones', loadChildren: () => import('./regiones/regiones.module').then(m => m.RegionesModule)},
  { path: 'derroteros', loadChildren: () => import('./derroteros/derroteros.module').then(m => m.DerroterosModule)},
  { path: 'tarifas', loadChildren: () => import('./tarifas/tarifas.module').then(m => m.TarifasModule)},
  { path: 'turnos', loadChildren: () => import('./turnos/turnos.module').then(m => m.TurnosModule)},
  { path: 'vista-pasajero', loadChildren: () => import('./vista-pasajero/vista-pasajero.module').then(m => m.VistaPasajeroModule)},
  { path: 'reportes', loadChildren: () => import('./reportes/reportes.module').then(m => m.ReportesModule)},
  { path: 'talleres', loadChildren: () => import('./talleres/talleres.module').then(m => m.TalleresModule)},
  { path: 'mantenimientos', loadChildren: () => import('./mantenimiento/mantenimiento.module').then(m => m.MantenimientoModule)},
  { path: 'tipo-pasajero', loadChildren: () => import('./tipo-pasajero/tipo-pasajero.module').then(m => m.TipoPasajeroModule)},
  { path: 'verificaciones', loadChildren: () => import('./verificaciones/verificaciones.module').then(m => m.VerificacionesModule)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
