import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'Coordinación',
        permiso: Permiso.Consultar_Dashboard,
        isTitle: true
    },
    {
        id: 12,
        label: 'Dashboard',
        icon: 'uil-home',
        permiso: Permiso.Consultar_Dashboard,
        link: '/',
    },
    {
        id: 20,
        label: 'Administración',
        icon: 'uil-store-alt',
        permiso: Permiso.Listado_Modulos,
        subItems: [
            {
                id: 16,
                label: 'Módulos',
                icon: 'uil-apps',
                link: '/modulos',
                permiso: Permiso.Listado_Modulos
            },
            {
                id: 15,
                label: 'Permisos',
                icon: 'uil-clipboard-notes',
                link: '/permisos',
                permiso: Permiso.Listado_Permisos
            },
            {
                id: 8,
                label: 'Bitácora',
                icon: 'uil-list-ul',
                link: '/bitacora/lista-bitacora',
                permiso: Permiso.Listado_Bitacora
            },
            {
                id: 15,
                label: 'Roles',
                icon: 'uil-clipboard-notes',
                link: '/roles',
                permiso: Permiso.Listado_Roles
            },
        ],
    },
    {
        id: 15,
        label: 'Usuarios',
        icon: 'uil-user',
        link: '/usuarios',
        permiso: Permiso.Listado_Usuarios
    },
    {
        id: 14,
        label: 'Clientes',
        icon: 'uil-users-alt',
        link: '/clientes',
        permiso: Permiso.Listado_Cliente
    },
    {
        id: 1,
        label: 'Operación',
        isTitle: true
    },
    {
        id: 2,
        label: 'Dispositivos',
        icon: 'uil-document-layout-left',
        link: '/dispositivos',
        permiso: Permiso.Listado_Dispositivos
    },
    {
        id: 2,
        label: 'Bluevox',
        icon: 'uil-document-layout-left',
        link: '/bluevox/dispositivo-bluevox',
        permiso: Permiso.Listado_BlueVoxs
    },
    {
        id: 3,
        label: 'Vehículos',
        icon: 'uil-car',
        link: '/vehiculos',
        permiso: Permiso.Listado_Vehiculos
    },
    {
        id: 4,
        label: 'Operadores',
        icon: 'uil-users-alt',
        link: '/operadores',
        permiso: Permiso.Listado_Operadores
    },
    {
        id: 4,
        label: 'Instalaciones',
        icon: 'uil-plug',
        link: '/instalaciones',
        permiso: Permiso.Listado_Instalaciones
    },
    {
        id: 6,
        label: 'Pasajeros',
        icon: 'uil-user-circle',
        link: '/pasajeros',
        permiso: Permiso.Listado_Pasajeros
    },
    {
        id: 20,
        label: 'Centro de Pagos',
        icon: 'uil-refresh',
        subItems: [
            {
                id: 16,
                label: 'Punto de Venta',
                icon: 'uil-apps',
                link: '/punto-venta',
                permiso: Permiso.Punto_Venta
            },
            {
                id: 5,
                label: 'Monederos',
                icon: 'uil-moneybag-alt',
                link: '/monederos',
                permiso: Permiso.Listado_Monederos
            },
            {
                id: 7,
                label: 'Transacciones',
                icon: 'uil-refresh',
                link: '/transacciones',
                permiso: Permiso.Listado_Transacciones
            },
        ],
    },
    {
        id: 15,
        label: 'Gestión de Viajes',
        icon: 'uil-arrows-right-down',
        permiso: Permiso.Listado_Rutas,
        subItems: [
            {
                id: 9,
                label: 'Regiones',
                link: '/regiones',
                permiso: Permiso.Listado_Regiones
            },
            {
                id: 9,
                label: 'Rutas',
                link: '/rutas',
                permiso: Permiso.Listado_Rutas,
            },
            {
                id: 9,
                label: 'Derroteros',
                link: '/derroteros',
                permiso: Permiso.Listado_Derroteros
            },
            {
                id: 9,
                label: 'Tarifas',
                link: '/tarifas',
                permiso: Permiso.Listado_Tarifas
            },
        ]
    },
    {
        id: 11,
        label: 'Monitoreo',
        icon: 'uil-map',
        link: '/monitoreo',
        permiso: Permiso.Consultar_Monitoreo
    },
    {
        id: 9,
        label: 'Turnos',
        link: '/turnos',
        icon: 'uil-schedule',
        permiso: Permiso.Listado_Turnos
    },
    {
        id: 10,
        label: 'Bitácora de Viajes',
        icon: 'uil-bag-alt',
        link: '/bluevox/lista-bluevox',
        permiso: Permiso.Listado_ConteoPasajeros
    },
    {
        id: 13,
        label: 'Perfil',
        icon: 'uil-user-circle',
        link: '/contacts/profile',
    },
    {
        id: 115,
        label: 'Reportes',
        isTitle: true
    },
    {
        id: 116,
        label: 'Recaudación Día',
        icon: 'uil-calendar-alt',
        link: '/reportes/recaudacion-diaria-ruta',
    },
    {
        id: 116,
        label: 'Recaudación Operador',
        icon: 'uil-user-check',
        link: '/reportes/recaudacion-operador',
    },
    {
        id: 116,
        label: 'Recaudación Vehículo',
        icon: 'uil-car-sideview',
        link: '/reportes/recaudacion-vehiculo',
    },
    {
        id: 116,
        label: 'Recaudación Disp/Inst.',
        icon: 'uil-cpu',
        link: '/reportes/recaudacion-dispositivoInstalacion',
    },
    {
        id: 116,
        label: 'Recaudación Detalladas',
        icon: 'uil-list-ul',
        link: '/reportes/recaudacion-detalladas',
    },

    // {
    //     id: 13,
    //     label: 'Pasajero',
    //     icon: 'uil-user',
    //     link: '/vista-pasajero',
    // },
    // {
    //     id: 115,
    //     label: 'MENUITEMS.PRUEBACOMPONENTCERRAR.TEXT',
    //     isTitle: true
    // },
    // {
    //     id: 116,
    //     label: 'MENUITEMS.PRUEBACUATROSESION.TEXT',
    //     icon: 'uil-arrow-to-right',
    //     link: '/account/login',
    // },
];

