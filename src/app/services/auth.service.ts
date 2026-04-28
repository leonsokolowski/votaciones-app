import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  sb = inject(SupabaseService)
  router = inject(Router)
  usuario_actual: User | null = null;
  
  constructor() {
    // Saber si el usuario está logueado o no
    this.sb.supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      if (session === null) { // Se cierra sesión o no hay sesión
        this.usuario_actual = null;
        
        // Limpiar cualquier estado local de la aplicación
        this.limpiarEstadoLocal();
        
        // Redirigir al login
        this.router.navigateByUrl("/login");
      } else { // Si hay sesión
        this.usuario_actual = session.user;
        const currentUrl = this.router.url;

        if (currentUrl === '/login' || currentUrl === '/registro' || currentUrl === '/') {
          // Redirigir al home
          this.router.navigateByUrl("/home");
        }
      }
    });
  }

  async iniciarSesion(email: string, password: string) {
    return await this.sb.supabase.auth.signInWithPassword({ email, password });
  }

  async registrar(email: string, password: string) {
    return await this.sb.supabase.auth.signUp({ email, password });
  }

  async cerrarSesion() {
    // Limpiar estado antes de cerrar sesión
    this.limpiarEstadoLocal();
    
    // Cerrar la sesión en Supabase
    const result = await this.sb.supabase.auth.signOut();
    
    // Asegurar que el usuario actual se limpie inmediatamente
    this.usuario_actual = null;
    
    return result;
  }

  async obtenerUsuario() {
    return await this.sb.supabase.auth.getUser();
  }

  private limpiarEstadoLocal() {
    // Limpiar cualquier dato almacenado localmente
    // Por ejemplo, si tienes datos en localStorage o sessionStorage
    
    // localStorage.removeItem('userData');
    // sessionStorage.clear();
    
    // Aquí puedes agregar cualquier otra limpieza de estado que necesites
    console.log('Estado local limpiado');
  }
}