import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-operador',
  templateUrl: './alta-operador.component.html',
  styleUrl: './alta-operador.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaOperadorComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public operadorForm: FormGroup;
  public idOperador: number;
  public title = 'Agregar Operador';
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operService: OperadoresService,
    private activatedRouted: ActivatedRoute,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.initForm()
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idOperador = params['idOperador'];
        if (this.idOperador) {
          this.title = 'Actualizar Operador';
          this.obtenerOperadorID();
        }
      }
    )
  }

  obtenerOperadorID() {
    this.operService.obtenerOperador(this.idOperador).subscribe(
      (response: any) => {
        const fecha = response.operador.FechaNacimiento
          ? response.operador.FechaNacimiento.split('T')[0]
          : '';
        this.operadorForm.patchValue({
          Estatus: response.operador.Estatus,
          Nombre: response.operador.Nombre,
          ApellidoPaterno: response.operador.ApellidoPaterno,
          ApellidoMaterno: response.operador.ApellidoMaterno,
          Telefono: response.operador.Telefono,
          Correo: response.operador.Correo,
          NumeroLicencia: response.operador.NumeroLicencia,
          FechaNacimiento: fecha,
        });
      }
    );
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  initForm() {
    this.operadorForm = this.fb.group({
      Nombre: ['', Validators.required],
      ApellidoPaterno: ['', Validators.required],
      ApellidoMaterno: ['', Validators.required],
      NumeroLicencia: ['', Validators.required],
      FechaNacimiento: ['', Validators.required],
      Correo: ['', [Validators.required, Validators.email]],
      Telefono: ['', Validators.required],
      Estatus: [1, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idOperador) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.operadorForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Nombre: 'Nombre',
        ApellidoPaterno: ' Apellido Paterno',
        ApellidoMaterno: 'Apellido Materno',
        NumeroLicencia: 'Número de Licencia',
        FechaNacimiento: 'Fecha de Nacimiento',
        Correo: 'Correo Electrónico',
        Telefono: 'Teléfono',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.operadorForm.controls).forEach(key => {
        const control = this.operadorForm.get(key);
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
    this.operadorForm.removeControl('id');
    this.operService.agregarOperador(this.operadorForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo operador de manera exitosa.`,
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
          text: `Ocurrió un error al agregar el operador.`,
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
    if (this.operadorForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Nombre: 'Nombre',
        ApellidoPaterno: ' Apellido Paterno',
        ApellidoMaterno: 'Apellido Materno',
        NumeroLicencia: 'Número de Licencia',
        FechaNacimiento: 'Fecha de Nacimiento',
        Correo: 'Correo Electrónico',
        Telefono: 'Teléfono',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.operadorForm.controls).forEach(key => {
        const control = this.operadorForm.get(key);
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
    this.operService.actualizaridOperador(this.idOperador, this.operadorForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Los datos del operador se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el operador.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/operadores');
  }

  // Referencias
@ViewChild('ineFileInput') ineFileInput!: ElementRef<HTMLInputElement>;
@ViewChild('licenciaFileInput') licenciaFileInput!: ElementRef<HTMLInputElement>;

// Propiedades
inePreviewUrl: string | ArrayBuffer | null = null;
licenciaPreviewUrl: string | ArrayBuffer | null = null;

ineDragging = false;
licenciaDragging = false;


/* INE */
openIneFilePicker(): void { this.ineFileInput.nativeElement.click(); }
onIneDragOver(ev: DragEvent){ ev.preventDefault(); this.ineDragging = true; }
onIneDragLeave(_ev: DragEvent){ this.ineDragging = false; }
onIneDrop(ev: DragEvent){ ev.preventDefault(); this.ineDragging = false; const file = ev.dataTransfer?.files?.[0]; if (file) this.handleIneFile(file); }
onIneFileSelected(event: Event){ const file = (event.target as HTMLInputElement).files?.[0]; if (file) this.handleIneFile(file); }
clearIneImage(ev: Event){ ev.stopPropagation(); this.inePreviewUrl=null; this.ineFileInput.nativeElement.value=''; this.operadorForm.patchValue({INE:null}); }
private handleIneFile(file: File){
  if(!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size>3*1024*1024){ this.operadorForm.get('INE')?.setErrors({invalid:true}); return; }
  const reader=new FileReader(); reader.onload=()=>this.inePreviewUrl=reader.result; reader.readAsDataURL(file);
  this.operadorForm.patchValue({INE:file}); this.operadorForm.get('INE')?.setErrors(null);
}

/* LICENCIA */
openLicenciaFilePicker(): void { this.licenciaFileInput.nativeElement.click(); }
onLicenciaDragOver(ev: DragEvent){ ev.preventDefault(); this.licenciaDragging = true; }
onLicenciaDragLeave(_ev: DragEvent){ this.licenciaDragging = false; }
onLicenciaDrop(ev: DragEvent){ ev.preventDefault(); this.licenciaDragging = false; const file = ev.dataTransfer?.files?.[0]; if (file) this.handleLicenciaFile(file); }
onLicenciaFileSelected(event: Event){ const file = (event.target as HTMLInputElement).files?.[0]; if (file) this.handleLicenciaFile(file); }
clearLicenciaImage(ev: Event){ ev.stopPropagation(); this.licenciaPreviewUrl=null; this.licenciaFileInput.nativeElement.value=''; this.operadorForm.patchValue({Licencia:null}); }
private handleLicenciaFile(file: File){
  if(!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size>3*1024*1024){ this.operadorForm.get('Licencia')?.setErrors({invalid:true}); return; }
  const reader=new FileReader(); reader.onload=()=>this.licenciaPreviewUrl=reader.result; reader.readAsDataURL(file);
  this.operadorForm.patchValue({Licencia:file}); this.operadorForm.get('Licencia')?.setErrors(null);
}
}
