import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service'; 
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, RouterModule]
})
export class LoginComponent implements OnInit {
 
  auth = inject(AuthService);
 
  formLogin = new FormGroup({
    'email': new FormControl("", [Validators.required, Validators.email]),
    'password': new FormControl("", [Validators.required, Validators.minLength(8)])
  });
 
  errorMessage: string = "";
 
  constructor(private router: Router) {}
 
  async login() {
    this.errorMessage = "";
 
    if (this.formLogin.invalid) {
      this.errorMessage = "Por favor completá todos los campos correctamente.";
      return;
    }
 
    const email = String(this.formLogin.get("email")?.value);
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
