import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'NAV.COORDINACION',
        permiso: Permiso.Consultar_Dashboard,
        isTitle: true
    },
    {
        id: 12,
        label: 'NAV.DASHBOARD',
        icon: 'uil-home',
        permiso: Permiso.Consultar_Dashboard,
        link: '/',
    },
    {
        id: 20,
        label: 'NAV.ADMINISTRACION',
        icon: 'uil-store-alt',
        permiso: Permiso.Desplegable_Administracion,
        subItems: [
            {
                id: 16,
                label: 'NAV.MODULOS',
                icon: 'uil-apps',
                link: '/modulos',
                permiso: Permiso.Listado_Modulos
            },
            {
                id: 15,
                label: 'NAV.PERMISOS',
                icon: 'uil-clipboard-notes',
                link: '/permisos',
                permiso: Permiso.Listado_Permisos
            },
            {
                id: 15,
                label: 'NAV.ROLES',
                icon: 'uil-clipboard-notes',
                link: '/roles',
                permiso: Permiso.Listado_Roles
            },
            {
                id: 15,
                label: 'NAV.TIPO_PASAJERO',
                link: '/tipo-pasajero',
                permiso: Permiso.Listado_TipoPasajero
            },
            {
                id: 8,
                label: 'NAV.BITACORA',
                icon: 'uil-list-ul',
                link: '/bitacora/lista-bitacora',
                permiso: Permiso.Listado_Bitacora
            },
        ],
    },
    {
        id: 15,
        label: 'NAV.USUARIOS',
        icon: 'uil-user',
        link: '/usuarios',
        permiso: Permiso.Listado_Usuarios
    },
    {
        id: 14,
        label: 'NAV.CLIENTES',
        icon: 'uil-users-alt',
        link: '/clientes',
        permiso: Permiso.Listado_Cliente
    },
    {
        id: 1,
        label: 'NAV.CONFIGURACION',
        isTitle: true
    },
    {
        id: 2,
        label: 'NAV.DISPOSITIVOS',
        icon: 'uil-document-layout-left',
        link: '/dispositivos',
        permiso: Permiso.Listado_Dispositivos
    },
    {
        id: 2,
        label: 'NAV.BLUEVOX',
        icon: 'uil-book',
        link: '/bluevox/dispositivo-bluevox',
        permiso: Permiso.Listado_BlueVoxs
    },
    {
        id: 3,
        label: 'NAV.VEHICULOS',
        icon: 'uil-car',
        link: '/vehiculos',
        permiso: Permiso.Listado_Vehiculos
    },
    {
        id: 4,
        label: 'NAV.OPERADORES',
        icon: 'uil-users-alt',
        link: '/operadores',
        permiso: Permiso.Listado_Operadores
    },
    {
        id: 4,
        label: 'NAV.INSTALACIONES',
        icon: 'uil-plug',
        link: '/instalaciones',
        permiso: Permiso.Listado_Instalaciones
    },
    {
        id: 6,
        label: 'NAV.PASAJEROS',
        icon: 'uil-user-circle',
        link: '/pasajeros',
        permiso: Permiso.Listado_Pasajeros
    },
    {
        id: 13,
        label: 'NAV.PERFIL',
        icon: 'uil-user-circle',
        link: '/contacts/profile',
    },
    {
        id: 1,
        label: 'NAV.OPERACION',
        isTitle: true
    },
    {
        id: 20,
        label: 'NAV.CENTRO_PAGOS',
        icon: 'uil-refresh',
        permiso: Permiso.Desplegable_Centro_Pagos,
        subItems: [
            {
                id: 16,
                label: 'NAV.PUNTO_VENTA',
                icon: 'uil-apps',
                link: '/punto-venta',
                permiso: Permiso.Punto_Venta
            },
            {
                id: 5,
                label: 'NAV.MONEDEROS',
                icon: 'uil-moneybag-alt',
                link: '/monederos',
                permiso: Permiso.Listado_Monederos
            },
            {
                id: 7,
                label: 'NAV.TRANSACCIONES',
                icon: 'uil-refresh',
                link: '/transacciones',
                permiso: Permiso.Listado_Transacciones
            },
        ],
    },
    {
        id: 15,
        label: 'NAV.GESTION_VIAJES',
        icon: 'uil-arrows-right-down',
        permiso: Permiso.Desplegable_Gestion_Viajes,
        subItems: [
            {
                id: 9,
                label: 'NAV.REGIONES',
                link: '/regiones',
                permiso: Permiso.Listado_Regiones
            },
            {
                id: 9,
                label: 'NAV.RUTAS',
                link: '/rutas',
                permiso: Permiso.Listado_Rutas,
            },
            {
                id: 9,
                label: 'NAV.DERROTEROS',
                link: '/derroteros',
                permiso: Permiso.Listado_Derroteros
            },
            {
                id: 9,
                label: 'NAV.TARIFAS',
                link: '/tarifas',
                permiso: Permiso.Listado_Tarifas
            },
            {
                id: 9,
                label: 'NAV.VIAJES',
                link: '/viajes',
                permiso: Permiso.Listado_Viajes
            },
        ]
    },
    {
        id: 11,
        label: 'NAV.MONITOREO',
        icon: 'uil-map',
        link: '/monitoreo',
        permiso: Permiso.Consultar_Monitoreo
    },
    {
        id: 9,
        label: 'NAV.TURNOS',
        link: '/turnos',
        icon: 'uil-schedule',
        permiso: Permiso.Listado_Turnos
    },
    {
        id: 10,
        label: 'NAV.BITACORA_VIAJES',
        icon: 'uil-bag-alt',
        link: '/bluevox/lista-bluevox',
        permiso: Permiso.Listado_ConteoPasajeros
    },
    {
        id: 20,
        label: 'NAV.GESTION_VEHICULAR',
        permiso: Permiso.Desplegable_Vehicular,
        icon: 'uil-wrench',
        subItems: [
            {
                id: 16,
                label: 'NAV.TALLERES',
                icon: 'uil-apps',
                link: '/talleres',
                permiso: Permiso.Consultar_Taller
            },
            {
                id: 16,
                label: 'NAV.MANTENIMIENTO',
                icon: 'uil-apps',
                link: '/mantenimientos',
                permiso: Permiso.Consultar_Mantenimientos
            },
            {
                id: 16,
                label: 'NAV.VERIFICACIONES',
                icon: 'uil-apps',
                link: '/verificaciones',
                permiso: Permiso.Consultar_Verificacion
            },
            {
                id: 16,
                label: 'NAV.INCIDENTES',
                icon: 'uil-apps',
                link: '/incidentes',
                permiso: Permiso.Consultar_Siniestro
            },
        ],
    },
    {
        id: 115,
        label: 'NAV.REPORTES',
        permiso: Permiso.Consultar_Reportes,
        isTitle: true
    },
    {
        id: 11,
        label: 'NAV.HISTORIAL_POSICIONES',
        icon: 'uil-history',
        link: '/posiciones',
        permiso: Permiso.Consultar_Historial_Posiciones
    },
    {
        id: 116,
        label: 'NAV.RECAUDACION_DIA',
        icon: 'uil-calendar-alt',
        permiso: Permiso.Consultar_Recaudacion_Dia,
        link: '/reportes/recaudacion-diaria-ruta',
    },
    {
        id: 116,
        label: 'NAV.RECAUDACION_OPERADOR',
        icon: 'uil-user-check',
        link: '/reportes/recaudacion-operador',
        permiso: Permiso.Consultar_Recaudacion_Operador,
    },
    {
        id: 116,
        label: 'NAV.RECAUDACION_VEHICULO',
        icon: 'uil-car-sideview',
        link: '/reportes/recaudacion-vehiculo',
        permiso: Permiso.Consultar_Recaudacion_Vehiculo,
    },
    {
        id: 116,
        label: 'NAV.RECAUDACION_DISPOSITIVO',
        icon: 'uil-plug',
        link: '/reportes/recaudacion-dispositivoInstalacion',
        permiso: Permiso.Consultar_Recaudacion_Dispositivo,
    },
    //{
    //    id: 116,
    //    label: 'Recaudación Detalladas',
    //    icon: 'uil-list-ul',
    //    link: '/reportes/recaudacion-detalladas',
    //    permiso: Permiso.Consultar_Recaudacion_Detallada,
    //},

    // {
    //     id: 13,
    //     label: 'Pasajero',
    //     icon: 'uil-user',
    //     permiso: Permiso.Perfil_Pasajero,
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

