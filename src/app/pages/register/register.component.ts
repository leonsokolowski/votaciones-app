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
import { RouterModule } from '@angular/router';
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
  db = inject(DbService);

  provincias = PROVINCIAS_AR;
  mensajeError = '';
  mostrarContrasena = false;
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

  constructor() {
    addIcons({ scanOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  // ─── Helpers de validación por campo ───────────────────────────────────────

  /** Devuelve true si el campo fue tocado y tiene errores */
  esInvalido(campo: string): boolean {
    const control = this.formularioRegistro.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  /** Mensaje de error específico por campo */
  obtenerError(campo: string): string {
    const control = this.formularioRegistro.get(campo);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required'])        return 'Este campo es obligatorio.';
    if (control.errors['email'])           return 'Ingresá un correo electrónico válido.';
    if (control.errors['minlength'])       return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
    if (control.errors['nombreInvalido'])  return 'Solo se permiten letras y espacios (mín. 2 caracteres).';
    if (control.errors['dniInvalido'])     return 'El DNI debe tener 7 u 8 dígitos.';
    if (control.errors['telefonoInvalido']) return 'Ingresá un teléfono válido (ej: 1123456789 o +541123456789).';

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

  validarCorreo(): void {
    this.formularioRegistro.get('correo')?.markAsTouched();
  }

  validarContrasena(): void {
    const contrasena = this.formularioRegistro.get('contrasena');
    const confirmar  = this.formularioRegistro.get('confirmar_contrasena');
    contrasena?.markAsTouched();
    // Re-validar confirmar si ya fue tocado
    if (confirmar?.touched) confirmar.updateValueAndValidity();
  }

  validarConfirmarContrasena(): void {
    this.formularioRegistro.get('confirmar_contrasena')?.markAsTouched();
  }

  validarNombre(): void {
    this.formularioRegistro.get('nombre')?.markAsTouched();
  }

  validarApellido(): void {
    this.formularioRegistro.get('apellido')?.markAsTouched();
  }

  validarDni(): void {
    this.formularioRegistro.get('dni')?.markAsTouched();
  }

  validarProvincia(): void {
    this.formularioRegistro.get('provincia')?.markAsTouched();
  }

  validarCiudad(): void {
    this.formularioRegistro.get('ciudad')?.markAsTouched();
  }

  validarTelefono(): void {
    this.formularioRegistro.get('telefono')?.markAsTouched();
  }

  // ─── Mostrar/ocultar contraseña ────────────────────────────────────────────

  alternarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  alternarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  // ─── Escáner de DNI ────────────────────────────────────────────────────────

  /**
   * Escanea el código de barras PDF417 del DNI argentino.
   * Requiere instalar: npm install @capacitor-mlkit/barcode-scanning
   * y agregar los permisos de cámara en AndroidManifest.xml / Info.plist.
   *
   * El código PDF417 del DNI argentino contiene:
   * @APELLIDO@NOMBRE@SEXO@DNI@EJEMPLO@FECHANAC@...
   */
  async escanearDni(): Promise<void> {
    this.escaneandoDni = true;
    this.mensajeError = '';

    try {
      // Importación dinámica para no romper en entornos web sin Capacitor
      const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');

      const concedido = await this.solicitarPermisoCamara(BarcodeScanner);
      if (!concedido) {
        this.mensajeError = 'Se necesita permiso de cámara para escanear el DNI.';
        return;
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Pdf417]
      });

      const codigoCrudo = barcodes[0]?.rawValue;
      if (barcodes.length > 0 && codigoCrudo) {
        this.procesarCodigoDni(codigoCrudo);
      } else {
        this.mensajeError = 'No se detectó ningún código. Intentá de nuevo.';
      }

    } catch (error: any) {
      // Mensaje amigable si se ejecuta en el navegador sin cámara real
      if (error?.message?.includes('not implemented') || error?.message?.includes('not available')) {
        this.mensajeError = 'El escaneo de DNI solo está disponible en dispositivos móviles.';
      } else {
        this.mensajeError = 'Error al escanear el DNI. Intentá de nuevo.';
        console.error('Error al escanear DNI:', error);
      }
    } finally {
      this.escaneandoDni = false;
    }
  }

  /** Solicita permiso de cámara; retorna true si fue concedido */
  private async solicitarPermisoCamara(escaner: any): Promise<boolean> {
    const { camera: estadoActual } = await escaner.checkPermissions();
    if (estadoActual === 'granted') return true;

    const { camera: nuevoEstado } = await escaner.requestPermissions();
    return nuevoEstado === 'granted';
  }

  /**
   * Procesa el string del código de barras del DNI argentino.
   * Formato PDF417: @APELLIDO@NOMBRE@SEXO@NRO_DOC@TRAMITE@NACIMIENTO@...
   */
  private procesarCodigoDni(codigoCrudo: string): void {
    // El PDF417 usa '@' como separador
    const partes = codigoCrudo.split('@').filter(p => p.trim() !== '');

    if (partes.length < 4) {
      this.mensajeError = 'No se pudo leer el DNI. Asegurate de enfocar bien el código de barras.';
      return;
    }

    const apellido = this.convertirATituloMayuscula(partes[0]);
    const nombre   = this.convertirATituloMayuscula(partes[1]);
    const dni      = partes[3]?.replace(/\./g, '').trim();

    // Si el nombre completo tiene varios nombres, tomamos solo el primero
    const primerNombre = nombre.split(' ')[0] ?? '';

    this.formularioRegistro.patchValue({
      apellido: apellido,
      nombre:   primerNombre,
      dni:      dni,
    });

    // Marcar como tocados para que muestren estado válido
    ['apellido', 'nombre', 'dni'].forEach(campo => {
      this.formularioRegistro.get(campo)?.markAsTouched();
      this.formularioRegistro.get(campo)?.updateValueAndValidity();
    });
  }

  /** Convierte "GARCIA LOPEZ" → "Garcia Lopez" */
  private convertirATituloMayuscula(texto: string): string {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  // ─── Envío del formulario ─────────────────────────────────────────────────

  async registrar(): Promise<void> {
    this.mensajeError = '';
 
    // Marcar todos los campos como tocados para mostrar errores pendientes
    this.formularioRegistro.markAllAsTouched();
 
    if (this.formularioRegistro.invalid) {
      this.mensajeError = 'Por favor completá todos los campos correctamente.';
      return;
    }
 
    const { correo, contrasena } = this.formularioRegistro.value;
 
    const { error } = await this.auth.registrar(correo!, contrasena!);
 
    if (error) {
      this.mensajeError = error.message.toUpperCase() || 'Error al registrarse.';
    }
    // Solo si el auth fue exitoso, guardamos los datos en la tabla
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
        this.mensajeError = 'Usuario creado pero hubo un error al guardar los datos.';
      }
      // La redirección la sigue manejando el AuthService
    }
}