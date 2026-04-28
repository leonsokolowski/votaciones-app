import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Usuario {
  correo: string;
  nombre: string;
  apellido: string;
  dni: number;
  provincia: string;
  ciudad: string;
  telefono: number;
}

@Injectable({
  providedIn: 'root',
})
export class DbService {

  sb = inject(SupabaseService);

  async guardarUsuario(usuario: Usuario) {
    return await this.sb.supabase
      .from('usuarios')
      .insert(usuario);
  }
}