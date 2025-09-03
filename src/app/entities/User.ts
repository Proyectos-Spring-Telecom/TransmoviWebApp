export class User {
    id: string
    token: string;
    refreshToken?: string;
    nombre: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    nombreCompleto?: string;
    permisos: any[];
    email:string;
    idCliente?:any;
    imagenPerfil: string;
    user: any;
}