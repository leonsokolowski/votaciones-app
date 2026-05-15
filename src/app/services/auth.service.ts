import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { filter, take } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  sb = inject(SupabaseService);
  router = inject(Router);
  usuario_actual: User | null = null;
 
  // Flag para evitar que onAuthStateChange redirija durante el registro,
  // ya que el componente necesita terminar de guardar los datos en la tabla
  // antes de cualquier navegación.
  private registrando = false;
 
  constructor() {
    this.sb.supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);
 
      // Si estamos en medio del registro, ignoramos el evento SIGNED_IN
      // para que el componente pueda completar el guardado en la tabla primero.
      if (this.registrando && event === 'SIGNED_IN') {
        console.log('Registro en curso, se omite la redirección automática.');
        return;
      }
 
      if (session === null) {
        this.usuario_actual = null;
        this.limpiarEstadoLocal();
        this.router.navigateByUrl('/login');
      } else {
        this.usuario_actual = session.user;
        console.log('URL actual:', this.router.url);
 
        // Esperamos a que el router esté estable antes de chequear la URL
        this.router.events.pipe(
          filter(e => e instanceof NavigationEnd),
          take(1)
        ).subscribe(() => {
          const currentUrl = this.router.url;
          if (currentUrl === '/login' || currentUrl === '/registro' || currentUrl === '/') {
            this.router.navigateByUrl('/home');
          }
        });
 
        // Si el router ya está en una de esas rutas y no hay navegación en curso
        const currentUrl = this.router.url;
        if (currentUrl === '/login' || currentUrl === '/registro' || currentUrl === '/') {
          this.router.navigateByUrl('/home');
        }
      }
    });
  }
 
  async iniciarSesion(email: string, password: string) {
    return await this.sb.supabase.auth.signInWithPassword({ email, password });
  }
 
  async registrar(email: string, password: string) {
    this.registrando = true;
    try {
      const result = await this.sb.supabase.auth.signUp({ email, password });
      return result;
    } finally {
      // El flag se apaga en registrarCompleto() una vez que
      // el componente terminó de guardar todo en la base de datos.
      // Usamos finally para garantizar que se limpie incluso si hay error en signUp.
      this.registrando = false;
    }
  }
 
  // Llamar desde el componente DESPUÉS de guardar exitosamente en la tabla,
  // para habilitar de nuevo la redirección automática.
  registrarCompleto() {
    this.registrando = false;
  }
 
  async cerrarSesion() {
    this.limpiarEstadoLocal();
    const result = await this.sb.supabase.auth.signOut();
    this.usuario_actual = null;
    return result;
  }
 
  async obtenerUsuario() {
    return await this.sb.supabase.auth.getUser();
  }
 
  private limpiarEstadoLocal() {
    // localStorage.removeItem('userData');
    // sessionStorage.clear();
    console.log('Estado local limpiado');
  }
}
 