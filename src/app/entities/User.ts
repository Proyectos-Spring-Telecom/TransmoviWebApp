export class User {
    id: string
    token: string;
    refreshToken?: string;
    nombre: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    nombreCompleto?: string;
    telefono: any;
    permisos: any[];
    email:string;
    idCliente?:any;
    imagenPerfil: string;
    user: any;
    rol: any;
    userName: any;
    fotoPerfil: any;

}