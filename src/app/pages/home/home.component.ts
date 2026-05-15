import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonIcon
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DbService, Usuario } from 'src/app/services/db.service';
import { addIcons } from 'ionicons';
import { personOutline, cardOutline, locationOutline, callOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonButton, IonCard, IonCardContent,
    IonIcon,       
    RouterModule
  ]
})
export class HomeComponent implements OnInit {

  auth = inject(AuthService);
  db   = inject(DbService);

  usuario: Usuario | null = null;

  constructor() {
    addIcons({ personOutline, cardOutline, locationOutline, callOutline });
  }

  get iniciales(): string {
    if (!this.usuario) return '?';
    const n = this.usuario.nombre?.[0] ?? '';
    const a = this.usuario.apellido?.[0] ?? '';
    return (n + a).toUpperCase();
  }

  async ngOnInit() {
    const { data: authData } = await this.auth.obtenerUsuario();
    const correo = authData.user?.email;

    if (correo) {
      const { data } = await this.db.obtenerUsuarioPorCorreo(correo);
      this.usuario = data;
    }
  }

  logout() {
    this.auth.cerrarSesion();
  }
}