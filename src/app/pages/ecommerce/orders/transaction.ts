export interface Transaction {
  no: string;
  fecha: string;
  hora?: any;
  proveedor?: string;
  distribuidor?: string;
  region?: string;
  producto?: string;
  monto: any;
  telefono?: string;
  trn?: any;
  codigo?: any;
  segundos?: any;

  name?: string;
  status?: string;
  index?: number;
  checked?: boolean;

}