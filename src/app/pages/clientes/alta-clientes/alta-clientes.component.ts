import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-clientes',
  templateUrl: './alta-clientes.component.html',
  styleUrl: './alta-clientes.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaClientesComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public clienteForm: FormGroup;
  public idCliente: number;
  public title = 'Agregar Cliente';
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private clieService: ClientesService,
    private activatedRouted: ActivatedRoute,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.obtenerClientes()
    this.initForm();
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idCliente = params['idCliente'];
        if (this.idCliente) {
          this.title = 'Actualizar Cliente';
          this.obtenerClienteID();
        }
      }
    )
  }

  obtenerClientes(){
    this.clieService.obtenerClientes().subscribe((response)=> {
      this.listaClientes = response; 
    })
  }

  obtenerClienteID() {
    this.clieService.obtenerCliente(this.idCliente).subscribe(
      (response: any) => {
        this.clienteForm.patchValue({
          IdPadre: response.IdPadre,
          RFC: response.RFC,
          TipoPersona: response.TipoPersona,
          Estatus: response.Estatus,
          Logotipo: response.Logotipo,
          Nombre: response.Nombre,
          ApellidoPaterno: response.ApellidoPaterno,
          ApellidoMaterno: response.ApellidoMaterno,
          Telefono: response.Telefono,
          Correo: response.Correo,
          Estado: response.Estado,
          Municipio: response.Municipio,
          Colonia: response.Colonia,
          Calle: response.Calle,
          EntreCalles: response.EntreCalles,
          NumeroExterior: response.NumeroExterior,
          NumeroInterior: response.NumeroInterior,
          CP: response.CP,
          NombreEncargado: response.NombreEncargado,
          TelefonoEncargado: response.TelefonoEncargado,
          EmailEncargado: response.EmailEncargado
        });
      }
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.clienteForm.patchValue({ Logotipo: file });
      this.clienteForm.get('Logotipo')?.markAsTouched();
      this.clienteForm.get('Logotipo')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result; };
      reader.readAsDataURL(file);
    }
  }

  centerModal(centerDataModal: any) {
    this.modalService.open(centerDataModal, {
      centered: true,
      windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });
  }

  onTipoPersonaChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.clienteForm.get('TipoPersona')?.setValue(value);
  }

  sanitizeInput(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitizedValue = inputElement.value.replace(/[^A-Za-z0-9]/g, '');
    inputElement.value = sanitizedValue.slice(0, 13);
    this.clienteForm.get('RFC')?.setValue(inputElement.value, { emitEvent: false });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  initForm() {
    this.clienteForm = this.fb.group({
      IdPadre: ['', Validators.required],
      RFC: ['', Validators.required],
      TipoPersona: ['', Validators.required],
      Estatus: [1, Validators.required],
      Logotipo: ['https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI='],
      Nombre: ['', Validators.required],
      ApellidoPaterno: ['', Validators.required],
      ApellidoMaterno: ['', Validators.required],
      Telefono: ['', Validators.required],
      Correo: ['', [Validators.required, Validators.email]],
      Estado: ['', Validators.required],
      Municipio: ['', Validators.required],
      Colonia: ['', Validators.required],
      Calle: ['', Validators.required],
      EntreCalles: ['', Validators.required],
      NumeroExterior: ['', Validators.required],
      NumeroInterior: ['', Validators.required],
      CP: ['', Validators.required],
      NombreEncargado: ['', Validators.required],
      TelefonoEncargado: ['', Validators.required],
      EmailEncargado: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idCliente) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.clienteForm.invalid) {
      this.submitButton = 'Guardar';
        this.loading = false;
      const etiquetas: any = {
        IdPadre: 'Id Padre',
        RFC: 'RFC',
        TipoPersona: 'Tipo de Persona',
        Nombre: 'Nombre',
        ApellidoPaterno: 'Apellido Paterno',
        ApellidoMaterno: 'Apellido Materno',
        Telefono: 'Teléfono',
        Correo: 'Correo electrónico',
        Estado: 'Estado',
        Municipio: 'Municipio',
        Colonia: 'Colonia',
        Calle: 'Calle',
        EntreCalles: 'Entre Calles',
        CP: 'Código Postal',
        NumeroExterior: 'Número Exterior',
        NumeroInterior: 'Número Interior',
        NombreEncargado: 'Nombre del Encargado',
        TelefonoEncargado: 'Teléfono del Encargado',
        EmailEncargado: 'Email del Encargado'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                  background: #caa8a8; text-align: center; margin-bottom: 8px;
                  border-radius: 4px;">
        <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }
    this.clienteForm.removeControl('id');
    this.clieService.agregarCliente(this.clienteForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo cliente de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#22252f',
          text: `Ocurrió un error al agregar el cliente.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.clienteForm.invalid) {
      this.submitButton = 'Guardar';
        this.loading = false;
      const etiquetas: any = {
        IdPadre: 'Id Padre',
        RFC: 'RFC',
        TipoPersona: 'Tipo de Persona',
        Nombre: 'Nombre',
        ApellidoPaterno: 'Apellido Paterno',
        ApellidoMaterno: 'Apellido Materno',
        Telefono: 'Teléfono',
        Correo: 'Correo electrónico',
        Estado: 'Estado',
        Municipio: 'Municipio',
        Colonia: 'Colonia',
        Calle: 'Calle',
        EntreCalles: 'Entre Calles',
        CP: 'Código Postal',
        NumeroExterior: 'Número Exterior',
        NumeroInterior: 'Número Interior',
        NombreEncargado: 'Nombre del Encargado',
        TelefonoEncargado: 'Teléfono del Encargado',
        EmailEncargado: 'Email del Encargado'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                  background: #caa8a8; text-align: center; margin-bottom: 8px;
                  border-radius: 4px;">
        <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border'
        }
      });
    }
    this.clieService.actualizarCliente(this.idCliente, this.clienteForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Los datos del cliente se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#22252f',
          text: `Ocurrió un error al actualizar el cliente.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/clientes');
  }
}