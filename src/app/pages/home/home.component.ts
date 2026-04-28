import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormControl, FormGroup, FormsModule, Validators, ReactiveFormsModule} from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,IonContent,IonButton,IonCard, IonCardContent, IonCardHeader, IonCardTitle, RouterModule]
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  constructor() { }

  logout()
  {
    this.auth.cerrarSesion();
  }
  ngOnInit() {
  }

}
