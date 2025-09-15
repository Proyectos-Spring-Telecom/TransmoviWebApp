import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { PermisosService } from 'src/app/shared/services/permisos.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-transaccion',
  templateUrl: './agregar-transaccion.component.html',
  styleUrl: './agregar-transaccion.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarTransaccionComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public listaModulos: any;
  public transaccionForm: FormGroup;
  public idPermiso: number;
  public title = 'Generar Transacción';
  public listaDispositivos: any;
  public listaMonederos: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private transaccionService: TransaccionesService,
    private dispService: DispositivosService,
    private moneService: MonederosServices
  ) { }

  ngOnInit(): void {
    this.obtenerDispositivos();
    this.obtenerMonederos();
    this.initForm();
  }

  initForm() {
    this.transaccionForm = this.fb.group({
      tipoTransaccion: [null, Validators.required],
      monto: [null, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      latitud: [null],
      longitud: [null],
      fechaHora: [null, Validators.required],
      numeroSerieMonedero: ['', Validators.required],
      numeroSerieDispositivo: [null, Validators.required],
    });
  }

  toDatetimeLocal(isoZ: string | null): string {
    if (!isoZ) return '';
    const d = new Date(isoZ);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  }

  toIsoZulu(localStr: string | null): string | null {
    if (!localStr) return null;
    return new Date(localStr).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }


  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    console.log(this.transaccionForm.value)
    this.agregar();
  }

  obtenerDispositivos() {
    this.dispService.obtenerDispositivos().subscribe((response) => {
      this.listaDispositivos = response.data;
    })
  }

  obtenerMonederos() {
    this.moneService.obtenerMonederos().subscribe((response) => {
      this.listaMonederos = response.data
    })
  }

  agregar() {

    this.submitButton = 'Cargando...';
    this.loading = true;

    const etiquetas: Record<string, string> = {
      tipoTransaccion: 'Tipo de Transacción',
      monto: 'Monto',
      fechaHora: 'Fecha y Hora',
      numeroSerieMonedero: 'N° de Serie de Monedero',
      numeroSerieDispositivo: 'N° de Serie de Dispositivo'
    };

    if (this.transaccionForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const camposFaltantes: string[] = [];
      Object.keys(this.transaccionForm.controls).forEach((key) => {
        const control = this.transaccionForm.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;
                  background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Los siguientes <strong>campos</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    // Helper: 'YYYY-MM-DDTHH:mm' (local) -> ISO Z sin milisegundos
    const toIsoZulu = (localStr: string | null): string | null => {
      if (!localStr) return null;
      return new Date(localStr).toISOString().replace(/\.\d{3}Z$/, 'Z');
    };

    const raw = this.transaccionForm.value;

    const payload = {
      ...raw,
      tipoTransaccion: (raw?.tipoTransaccion || '').toString().toUpperCase() || null, // 'RECARGA' | 'DEBITO'
      monto: ((): number | null => {
        if (raw?.monto === '' || raw?.monto == null) return null;
        const n = Number(parseFloat(String(raw.monto).toString().replace(',', '.')).toFixed(2));
        return isNaN(n) ? null : n;
      })(),
      fechaHora: toIsoZulu(raw?.fechaHora || null), // -> '2025-09-10T12:30:00Z'
    };

    // Quita 'id' solo si existe en el form (evita errores)
    if (this.transaccionForm.contains('id')) {
      this.transaccionForm.removeControl('id');
    }

    // ⬇️ Reemplaza por tu servicio real de transacciones
    this.transaccionService.agregarTransaccion(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: 'Se agregó una nueva transacción de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#22252f',
          text: 'Ocurrió un error al agregar la transacción.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }


  moneyKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;

    const input = e.target as HTMLInputElement;
    const value = input.value || '';

    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }

    // Solo dígitos
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Simular el valor resultante para validar 2 decimales
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, selStart) + e.key + value.slice(selEnd);
    const parts = newValue.split('.');
    if (parts[1] && parts[1].length > 2) e.preventDefault();
  }

  moneyInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');

    // Mantener solo dígitos y un punto
    v = v.replace(/[^0-9.]/g, '');

    // Si hay más de un punto, conservar solo el primero
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, ''); // quitar puntos extra
      v = before + after;
    }

    // Limitar a 2 decimales
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);

    input.value = v;
    // Sin disparar validaciones múltiples
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
  }

  moneyPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);

    input.value = v;
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
  }

  moneyBlur(e: FocusEvent) {
    const input = e.target as HTMLInputElement;
    let v = input.value;

    if (!v) return;

    // Normalizar a 2 decimales (si hay punto), o agregar .00 si es entero
    if (/^\d+$/.test(v)) {
      v = v + '.00';
    } else if (/^\d+\.\d$/.test(v)) {
      v = v + '0';
    } else if (/^\d+\.\d{2}$/.test(v)) {
      // ok
    } else {
      // Re-sanitizar por si acaso
      v = v.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = v.split('.');
      v = parts[0] + (parts[1] ? '.' + parts[1].slice(0, 2) : '.00');
      if (/^\d+$/.test(v)) v = v + '.00';
      if (/^\d+\.\d$/.test(v)) v = v + '0';
    }

    input.value = v;
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
  }


  regresar() {
    this.route.navigateByUrl('/transacciones');
  }
}
