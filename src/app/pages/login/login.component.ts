import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { balloonOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, RouterModule]
})
export class LoginComponent implements OnInit {

  auth = inject(AuthService);

  formLogin = new FormGroup({
    'email': new FormControl("", [Validators.required, Validators.email]),
    'password': new FormControl("", [Validators.required, Validators.minLength(8)])
  });

  errorMessage: string = "";

  constructor(private router: Router) {
    addIcons({ balloonOutline });
  }

  /** Devuelve true si el campo fue tocado y tiene errores */
  esInvalido(campo: string): boolean {
    const control = this.formLogin.get(campo);
    return !!(control?.invalid && control?.touched);
  }

  /** Mensaje de error específico por campo */
  obtenerError(campo: string): string {
    const control = this.formLogin.get(campo);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      const nombres: Record<string, string> = {
        email: 'El correo electrónico',
        password: 'La contraseña'
      };
      return `${nombres[campo] ?? 'Este campo'} es obligatorio.`;
    }

    if (control.errors['email']) {
      return 'Ingresá una dirección de correo válida (ej: usuario@dominio.com).';
    }

    if (control.errors['minlength']) {
      const requerido = control.errors['minlength'].requiredLength;
      const actual    = control.errors['minlength'].actualLength;
      return `La contraseña debe tener al menos ${requerido} caracteres. Actualmente tiene ${actual}.`;
    }

    return 'Campo inválido.';
  }

  validarEmail(): void {
    this.formLogin.get('email')?.markAsTouched();
  }

  validarPassword(): void {
    this.formLogin.get('password')?.markAsTouched();
  }

  async login() {
    this.errorMessage = "";
    this.formLogin.markAllAsTouched();

    if (this.formLogin.invalid) {
      this.errorMessage = "Por favor completá todos los campos correctamente.";
      return;
    }

    const email    = String(this.formLogin.get("email")?.value);
    const password = String(this.formLogin.get("password")?.value);

    const { data, error } = await this.auth.iniciarSesion(email, password);

    if (error) {
      this.errorMessage = error.message.toUpperCase() || "Error al iniciar sesión.";
    } else {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {}
}