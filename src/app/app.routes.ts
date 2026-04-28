import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SplashComponent } from './pages/splash/splash.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  {path: "", component:SplashComponent, title: "Bienvenido"},
  {path: "login", component: LoginComponent, title: "Login"},
  {path: "register", component: RegisterComponent, title: "Registro"},
  {path: "home", component: HomeComponent, title: "Home"},
];
