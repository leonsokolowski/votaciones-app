import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {
  IonContent, IonItem, IonLabel, IonInput, IonButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonSelect, IonSelectOption, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { scanOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { DbService } from 'src/app/services/db.service';

// ─── Validadores personalizados ───────────────────────────────────────────────

/** Solo letras (incluyendo acentos y ñ), mínimo 2 caracteres */
export const validadorNombre: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const valido = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(control.value.trim());
  return valido ? null : { nombreInvalido: true };
};

/** DNI argentino: 7 u 8 dígitos */
export const validadorDni: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const valido = /^\d{7,8}$/.test(control.value.toString().replace(/\./g, ''));
  return valido ? null : { dniInvalido: true };
};

/** Teléfono argentino: opcionalmente empieza con +54, luego 10 dígitos */
export const validadorTelefono: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const limpio = control.value.toString().replace(/[\s\-\(\)]/g, '');
  const valido = /^(\+54)?[0-9]{10}$/.test(limpio);
  return valido ? null : { telefonoInvalido: true };
};

/** Validador de grupo: contraseña === confirmar contraseña */
export const validadorContrasenasIguales: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const contrasena = grupo.get('contrasena')?.value;
  const confirmar  = grupo.get('confirmar_contrasena')?.value;
  return contrasena && confirmar && contrasena !== confirmar ? { contrasenasNoCoinciden: true } : null;
};

// ─── Provincias argentinas ────────────────────────────────────────────────────

export const PROVINCIAS_AR = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

// ─── Nombres amigables para cada campo ───────────────────────────────────────

const NOMBRES_CAMPOS: Record<string, string> = {
  correo:               'El correo electrónico',
  contrasena:           'La contraseña',
  confirmar_contrasena: 'La confirmación de contraseña',
  nombre:               'El nombre',
  apellido:             'El apellido',
  dni:                  'El DNI',
  provincia:            'La provincia',
  ciudad:               'La ciudad',
  telefono:             'El teléfono',
};

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-registro',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonItem, IonLabel, IonInput, IonButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSelect, IonSelectOption, IonIcon, IonSpinner,
    RouterModule
  ]
})
export class RegisterComponent implements OnInit {

  auth = inject(AuthService);
  db   = inject(DbService);

  provincias = PROVINCIAS_AR;
  mensajeError        = '';
  mensajeConfirmacion = '';
  mostrarContrasena          = false;
  mostrarConfirmarContrasena = false;
  escaneandoDni = false;

  formularioRegistro = new FormGroup(
    {
      correo:               new FormControl('', [Validators.required, Validators.email]),
      contrasena:           new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmar_contrasena: new FormControl('', [Validators.required, Validators.minLength(8)]),
      nombre:               new FormControl('', [Validators.required, validadorNombre]),
      apellido:             new FormControl('', [Validators.required, validadorNombre]),
      dni:                  new FormControl('', [Validators.required, validadorDni]),
      provincia:            new FormControl('', [Validators.required]),
      ciudad:               new FormControl('', [Validators.required, Validators.minLength(2)]),
      telefono:             new FormControl('', [Validators.required, validadorTelefono]),
    },
    { validators: validadorContrasenasIguales }
  );

  constructor(private router: Router) {
    addIcons({ scanOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  // ─── Helpers de validación por campo ───────────────────────────────────────

  /** Devuelve true si el campo fue tocado y tiene errores */
  esInvalido(campo: string): boolean {
    const control = this.formularioRegistro.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  /** Mensaje de error específico y detallado por campo */
  obtenerError(campo: string): string {
    const control  = this.formularioRegistro.get(campo);
    const nombreCampo = NOMBRES_CAMPOS[campo] ?? 'Este campo';

    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return `${nombreCampo} es obligatorio.`;
    }

    if (control.errors['email']) {
      return 'Ingresá una dirección de correo válida (ej: usuario@dominio.com).';
    }

    if (control.errors['minlength']) {
      const requerido = control.errors['minlength'].requiredLength;
      const actual    = control.errors['minlength'].actualLength;
      return `${nombreCampo} debe tener al menos ${requerido} caracteres. Actualmente tiene ${actual}.`;
    }

    if (control.errors['maxlength']) {
      const maximo = control.errors['maxlength'].requiredLength;
      const actual = control.errors['maxlength'].actualLength;
      return `${nombreCampo} no puede superar los ${maximo} caracteres. Actualmente tiene ${actual}.`;
    }

    if (control.errors['nombreInvalido']) {
      return 'Solo se permiten letras, acentos y espacios. No uses números ni caracteres especiales. Mínimo 2 caracteres.';
    }

    if (control.errors['dniInvalido']) {
      const valor = control.value?.toString().replace(/\./g, '') ?? '';
      if (valor.length < 7) {
        return `El DNI debe tener entre 7 y 8 dígitos. Faltan ${7 - valor.length} dígito${7 - valor.length !== 1 ? 's' : ''}.`;
      }
      if (valor.length > 8) {
        return `El DNI no puede superar 8 dígitos. Tiene ${valor.length - 8} dígito${valor.length - 8 !== 1 ? 's' : ''} de más.`;
      }
      return 'El DNI solo debe contener dígitos, sin puntos ni espacios.';
    }

    if (control.errors['telefonoInvalido']) {
      const limpio = control.value?.toString().replace(/[\s\-\(\)]/g, '') ?? '';
      const sinPrefijo = limpio.startsWith('+54') ? limpio.slice(3) : limpio;
      if (!/^\d+$/.test(sinPrefijo)) {
        return 'El teléfono solo debe contener números. Podés incluir el prefijo +54 al inicio.';
      }
      if (sinPrefijo.length < 10) {
        return `El teléfono debe tener 10 dígitos (sin el prefijo +54). Faltan ${10 - sinPrefijo.length} dígito${10 - sinPrefijo.length !== 1 ? 's' : ''}. Ej: 1123456789.`;
      }
      if (sinPrefijo.length > 10) {
        return `El teléfono no puede superar 10 dígitos (sin el prefijo +54). Tiene ${sinPrefijo.length - 10} de más.`;
      }
      return 'Ingresá un teléfono válido. Ej: 1123456789 o +541123456789.';
    }

    return 'Campo inválido.';
  }

  /** Error de coincidencia de contraseñas a nivel de grupo */
  get contrasenasNoCoinciden(): boolean {
    return !!(
      this.formularioRegistro.errors?.['contrasenasNoCoinciden'] &&
      this.formularioRegistro.get('confirmar_contrasena')?.touched
    );
  }

  // ─── Validación individual por campo ───────────────────────────────────────

  validarCorreo(): void { this.formularioRegistro.get('correo')?.markAsTouched(); }

  validarContrasena(): void {
    const contrasena = this.formularioRegistro.get('contrasena');
    const confirmar  = this.formularioRegistro.get('confirmar_contrasena');
    contrasena?.markAsTouched();
    if (confirmar?.touched) confirmar.updateValueAndValidity();
  }

  validarConfirmarContrasena(): void { this.formularioRegistro.get('confirmar_contrasena')?.markAsTouched(); }
  validarNombre(): void    { this.formularioRegistro.get('nombre')?.markAsTouched(); }
  validarApellido(): void  { this.formularioRegistro.get('apellido')?.markAsTouched(); }
  validarDni(): void       { this.formularioRegistro.get('dni')?.markAsTouched(); }
  validarProvincia(): void { this.formularioRegistro.get('provincia')?.markAsTouched(); }
  validarCiudad(): void    { this.formularioRegistro.get('ciudad')?.markAsTouched(); }
  validarTelefono(): void  { this.formularioRegistro.get('telefono')?.markAsTouched(); }

  // ─── Mostrar/ocultar contraseña ────────────────────────────────────────────

  alternarContrasena(): void          { this.mostrarContrasena = !this.mostrarContrasena; }
  alternarConfirmarContrasena(): void { this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena; }

  // ─── Escáner de DNI ────────────────────────────────────────────────────────

  async escanearDni(): Promise<void> {
    this.escaneandoDni = true;
    this.mensajeError  = '';

    try {
      const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');

      const concedido = await this.solicitarPermisoCamara(BarcodeScanner);
      if (!concedido) {
        this.mensajeError = 'Se necesita permiso de cámara para escanear el DNI.';
        return;
      }

      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.Pdf417] });

      const codigoCrudo = barcodes[0]?.rawValue;
      if (barcodes.length > 0 && codigoCrudo) {
        this.procesarCodigoDni(codigoCrudo);
      } else {
        this.mensajeError = 'No se detectó ningún código. Asegurate de enfocar bien el código de barras y que haya buena iluminación.';
      }

    } catch (error: any) {
      if (error?.message?.includes('not implemented') || error?.message?.includes('not available')) {
        this.mensajeError = 'El escaneo de DNI solo está disponible en dispositivos móviles con cámara.';
      } else {
        this.mensajeError = 'Ocurrió un error al intentar escanear el DNI. Por favor, intentá de nuevo.';
        console.error('Error al escanear DNI:', error);
      }
    } finally {
      this.escaneandoDni = false;
    }
  }

  private async solicitarPermisoCamara(escaner: any): Promise<boolean> {
    const { camera: estadoActual } = await escaner.checkPermissions();
    if (estadoActual === 'granted') return true;
    const { camera: nuevoEstado } = await escaner.requestPermissions();
    return nuevoEstado === 'granted';
  }

  private procesarCodigoDni(codigoCrudo: string): void {
    const partes = codigoCrudo.split('@').filter((p: string) => p.trim() !== '');

    if (partes.length < 4) {
      this.mensajeError = 'No se pudo leer la información del DNI. Asegurate de enfocar bien el código de barras PDF417 (el más largo, al dorso del DNI).';
      return;
    }

    const apellido    = this.convertirATituloMayuscula(partes[0]);
    const nombre      = this.convertirATituloMayuscula(partes[1]);
    const dni         = partes[3]?.replace(/\./g, '').trim();
    const primerNombre = nombre.split(' ')[0] ?? '';

    this.formularioRegistro.patchValue({ apellido, nombre: primerNombre, dni });

    ['apellido', 'nombre', 'dni'].forEach(campo => {
      this.formularioRegistro.get(campo)?.markAsTouched();
      this.formularioRegistro.get(campo)?.updateValueAndValidity();
    });
  }

  private convertirATituloMayuscula(texto: string): string {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  // ─── Envío del formulario ─────────────────────────────────────────────────

  async registrar(): Promise<void> {
    this.mensajeError        = '';
    this.mensajeConfirmacion = '';

    this.formularioRegistro.markAllAsTouched();

    if (this.formularioRegistro.invalid) {
      const camposConError = Object.keys(this.formularioRegistro.controls)
        .filter(campo => this.formularioRegistro.get(campo)?.invalid)
        .map(campo => NOMBRES_CAMPOS[campo]?.toLowerCase().replace(/^(el|la)\s/, '') ?? campo);

      this.mensajeError = camposConError.length === 1
        ? `Por favor corregí el campo: ${camposConError[0]}.`
        : `Por favor corregí los siguientes campos: ${camposConError.join(', ')}.`;
      return;
    }

    const { correo, contrasena } = this.formularioRegistro.value;

    // 1. Verificación de DNI y teléfono
    const { dniExiste, telefonoExiste } = await this.db.verificarDatosUnicos(
      Number(this.formularioRegistro.value.dni),
      Number(this.formularioRegistro.value.telefono)
    );

    if (dniExiste) {
      this.mensajeError = 'Ya existe un usuario registrado con ese DNI.';
      return;
    }
    if (telefonoExiste) {
      this.mensajeError = 'Ya existe un usuario registrado con ese número de teléfono.';
      return;
    }

    // 2. Creación de usuario en Auth
    const { error } = await this.auth.registrar(correo!, contrasena!);
    if (error) {
      this.mensajeError = error.message.toUpperCase() || 'Error al registrarse.';
      return;
    }

    // 3. Guardado de datos en la tabla
    const { error: errorDb } = await this.db.guardarUsuario({
      correo: correo!,
      nombre: this.formularioRegistro.value.nombre!,
      apellido: this.formularioRegistro.value.apellido!,
      dni: Number(this.formularioRegistro.value.dni),
      provincia: this.formularioRegistro.value.provincia!,
      ciudad: this.formularioRegistro.value.ciudad!,
      telefono: Number(this.formularioRegistro.value.telefono),
    });

    if (errorDb) {
      console.error('Error Supabase al guardar:', errorDb);
      this.mensajeError = 'Error al guardar los datos. Intentá de nuevo.';
      await this.auth.cerrarSesion();
      return;
    }

    this.auth.registrarCompleto(); 
    this.router.navigateByUrl('/login');
  }
}