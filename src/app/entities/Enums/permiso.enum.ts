export enum Permiso {
  /* #region Clientes */
  Listado_Cliente = "1",
  Crear_Clientes = "2",
  Actualizar_Clientes = "3",
  CambiarEstatus_Cliente = "4",
  /* #endregion */

  /* #region Usuarios */
  Listado_Usuarios = "5",
  Crear_Usuarios = "6",
  Actualizar_Usuarios = "7",
  CambiarEstatus_Usuarios = "8",
  /* #endregion */

  /* #region Roles */
  Listado_Roles = "9",
  Crear_Roles = "10",
  Actualizar_Roles = "11",
  CambiarEstatus_Roles = "12",
  /* #endregion */

  /* #region Permisos */
  Listado_Permisos = "13",
  Crear_Permisos = "14",
  Actualizar_Permisos = "15",
  CambiarEstatus_Permisos = "16",
  /* #endregion */

  /* #region Módulos */
  Listado_Modulos = "17",
  Crear_Modulos = "18",
  Actualizar_Modulos = "19",
  CambiarEstatus_Modulos = "20",
  /* #endregion */

  /* #region UsuariosPermisos */
  Listado_UsuariosPermisos = "21",
  Crear_UsuariosPermisos = "22",
  Actualizar_UsuariosPermisos = "23",
  CambiarEstatus_UsuariosPermisos = "24",
  /* #endregion */

  /* #region UsuariosRegiones */
  Listado_UsuariosRegiones = "25",
  Crear_UsuariosRegiones = "26",
  Actualizar_UsuariosRegiones = "27",
  CambiarEstatus_UsuariosRegiones = "28",
  /* #endregion */

  /* #region UsuariosInstalaciones */
  Listado_UsuariosInstalaciones = "29",
  Crear_UsuariosInstalaciones = "30",
  Actualizar_UsuariosInstalaciones = "31",
  CambiarEstatus_UsuariosInstalaciones = "32",
  /* #endregion */

  /* #region Operadores */
  Listado_Operadores = "33",
  Crear_Operadores = "34",
  Actualizar_Operadores = "35",
  CambiarEstatus_Operadores = "36",
  /* #endregion */

  /* #region Vehículos */
  Listado_Vehiculos = "37",
  Crear_Vehiculos = "38",
  Actualizar_Vehiculos = "39",
  CambiarEstatus_Vehiculos = "40",
  /* #endregion */

  /* #region Dispositivos */
  Listado_Dispositivos = "41",
  Crear_Dispositivos = "42",
  Actualizar_Dispositivos = "43",
  CambiarEstatus_Dispositivos = "44",
  /* #endregion */

  /* #region BlueVoxs */
  Listado_BlueVoxs = "45",
  Crear_BlueVoxs = "46",
  Actualizar_BlueVoxs = "47",
  CambiarEstatus_BlueVoxs = "48",
  /* #endregion */

  /* #region Instalaciones (Vehículos en módulo 13) */
  Listado_Instalaciones = "49",
  Crear_Instalaciones = "50",
  Actualizar_Instalaciones = "51",
  CambiarEstatus_Instalaciones = "52",
  /* #endregion */

  /* #region Turnos */
  Listado_Turnos = "53",
  Crear_Turnos = "54",
  Actualizar_Turnos = "55",
  CambiarEstatus_Turnos = "56",
  /* #endregion */

  /* #region Viajes */
  Listado_Viajes = "57",
  Crear_Viajes = "58",
  Actualizar_Viajes = "59",
  CambiarEstatus_Viajes = "60",
  /* #endregion */

  /* #region Regiones */
  Listado_Regiones = "61",
  Crear_Regiones = "62",
  Actualizar_Regiones = "63",
  CambiarEstatus_Regiones = "64",
  /* #endregion */

  /* #region Rutas */
  Listado_Rutas = "65",
  Crear_Rutas = "66",
  Actualizar_Rutas = "67",
  CambiarEstatus_Rutas = "68",
  /* #endregion */

  /* #region Derroteros */
  Listado_Derroteros = "69",
  Crear_Derroteros = "70",
  Actualizar_Derroteros = "71",
  CambiarEstatus_Derroteros = "72",
  /* #endregion */

  /* #region Tarifas */
  Listado_Tarifas = "73",
  Crear_Tarifas = "74",
  Actualizar_Tarifas = "75",
  CambiarEstatus_Tarifas = "76",
  /* #endregion */

  /* #region Monederos */
  Listado_Monederos = "77",
  Crear_Monederos = "78",
  Actualizar_Monederos = "79",
  CambiarEstatus_Monederos = "80",
  /* #endregion */

  /* #region Pasajeros */
  Listado_Pasajeros = "81",
  Crear_Pasajeros = "82",
  Actualizar_Pasajeros = "83",
  CambiarEstatus_Pasajeros = "84",
  Perfil_Pasajero = "122",
  /* #endregion */

  /* #region Bitácora */
  Listado_Bitacora = "85",
  /* #endregion */

  /* #region ConteoPasajeros */
  Listado_ConteoPasajeros = "86",
  Crear_ConteoPasajeros = "87",
  /* #endregion */

  /* #region Posiciones */
  Crear_Posiciones = "89",
  /* #endregion */

  /* #region Transacciones */
  Listado_Transacciones = "90",
  Crear_Transacciones = "91",
  Punto_Venta = "99",
  /* #endregion */

  /* #region Extras / Pruebas */
  Consultar_Dashboard = "100",
  /* #endregion */

  /* #region Extras / Pruebas */
  Consultar_Monitoreo = "101",
  /* #endregion */

  /**#region Vehicular */
  Consultar_Modulos_Mantenimiento = "105",
  /** #endregion */

  /**#region Mantenimiento */
  Consultar_Mantenimientos = "106",
  Agregar_Mantenimiento = "107",
  Actualizar_Mantenimiento = "108",
  CambioEstatus_Mantenimiento = "109",
  /** #endregion */

  /**#region Verificacion */
  Consultar_Verificacion = "110",
  Agregar_Verificacion = "111",
  Actualizar_Verificacion = "112",
  CambioEstatus_Verificacion = "113",
  /** #endregion */

  /**#region Siniestro */
  Consultar_Siniestro = "114",
  Agregar_Siniestro = "115",
  Actualizar_Siniestro = "116",
  CambioEstatus_Siniestro = "117",
  /** #endregion */

  /**#region Taller */
  Consultar_Taller = "118",
  Agregar_Taller = "119",
  Actualizar_Taller = "120",
  CambioEstatus_Taller = "121",
  /** #endregion */

  /**#region Desplegables */
  Desplegable_Administracion = "124",
  Desplegable_Centro_Pagos = "125",
  Desplegable_Gestion_Viajes = "126",
  Desplegable_Vehicular = "127",
  /** #endregion */

  /**#region Reportes */
  Consultar_Reportes = "104",
  Consultar_Historial_Posiciones = "128",
  Consultar_Recaudacion_Dia = "129",
  Consultar_Recaudacion_Operador = "130",
  Consultar_Recaudacion_Vehiculo = "131",
  Consultar_Recaudacion_Dispositivo = "132",
  Consultar_Recaudacion_Detallada = "133",
  /** #endregion */

}

