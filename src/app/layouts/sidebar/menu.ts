import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 1,
         label: 'Trabajo',
         isTitle: true
    },
    {
        id: 12,
        label: 'Dashboard',
        icon: 'uil-home',
        link: '/',
        // permiso: Permiso.ConsultarAdministracion
    },
    {
        id: 15, //Continua el id 16
        label: 'Usuarios',
        icon: 'uil-user',
        link: '/usuarios',
    },
    {
        id: 14,
        label: 'Clientes',
        icon: 'uil-users-alt',
        link: '/clientes',
    },
    {
    id: 20,
    label: 'Administración',
    icon: 'uil-store-alt',
    subItems: [
        {
          id: 16,
          label: 'Módulos',
          icon: 'uil-apps',
          link: '/modulos',
        },
        {
            id: 15,
            label: 'Permisos',
            icon: 'uil-clipboard-notes',
            link: '/permisos',
        },
        {
            id: 15,
            label: 'Roles',
            icon: 'uil-clipboard-notes',
            link: '/roles',
        },
    ],
  },
    {
        id: 2,
        label: 'Dispositivos',
        icon: 'uil-document-layout-left',
        link: '/dispositivos',
        // permiso: Permiso.VerDispositivos
    },
    {
        id: 2,
        label: 'Bluevox',
        icon: 'uil-document-layout-left',
        link: '/bluevox/dispositivo-bluevox',
        // permiso: Permiso.VerDispositivos
    },
    {
        id: 10,
        label: 'Bitácora de Viajes',
        icon: 'uil-bag-alt',
        link: '/bluevox/lista-bluevox',
    },
    {
        id: 3,
        label: 'Vehículos',
        icon: 'uil-car',
        link: '/vehiculos',
        // permiso: Permiso.VerVehiculos
    },
    {
        id: 4,
        label: 'Operadores',
        icon: 'uil-users-alt',
        link: '/operadores',
        // permiso: Permiso.VerOperadores
    },
    {
        id: 5,
        label: 'Monederos',
        icon: 'uil-moneybag-alt',
        link: '/monederos/lista-monederos',
        // permiso: Permiso.VerMonederos
    },
    {
        id: 6,
        label: 'Pasajeros',
        icon: 'uil-user-circle',
        link: '/pasajeros',
        // permiso: Permiso.VerPasajeros
    },
    {
        id: 9,
        label: 'Rutas',
        icon: 'uil-arrows-right-down',
        link: '/rutas/lista-rutas',
    },
    {
        id: 11,
        label: 'Monitoreo',
        icon: 'uil-map',
        link: '/monitoreo',
    },
    {
        id: 7,
        label: 'Transacciones',
        icon: 'uil-refresh',
        link: '/transacciones/lista-transacciones',
        // permiso: Permiso.VerTransacciones
    },
    {
        id: 8,
        label: 'Bitácora',
        icon: 'uil-list-ul',
        link: '/bitacora/lista-bitacora',
        // permiso: Permiso.VerBitacora
    },
    {
        id: 13, 
        label: 'Perfil',
        icon: 'uil-user-circle',
        link: '/contacts/profile',
    },
    {
        id: 115,
        label: 'MENUITEMS.PRUEBACOMPONENTCERRAR.TEXT',
        isTitle: true
    },
    {
        id: 116,
        label: 'MENUITEMS.PRUEBACUATROSESION.TEXT',
        icon: 'uil-arrow-to-right',
        link: '/account/login',
    },
];

