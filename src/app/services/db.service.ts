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
  tipo?: string;
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

  async verificarDatosUnicos(dni: number, telefono: number): Promise<{ dniExiste: boolean, telefonoExiste: boolean }> {
    const [resultDni, resultTelefono] = await Promise.all([
      this.sb.supabase.from('usuarios').select('dni').eq('dni', dni).maybeSingle(),
      this.sb.supabase.from('usuarios').select('telefono').eq('telefono', telefono).maybeSingle(),
    ]);

    return {
      dniExiste:      resultDni.data !== null,
      telefonoExiste: resultTelefono.data !== null,
    };
  }

  async obtenerUsuarioPorCorreo(correo: string) {
    return await this.sb.supabase
      .from('usuarios')
      .select('*')
      .eq('correo', correo)
      .maybeSingle();
  }


}