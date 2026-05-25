import { Routes } from '@angular/router';


// Web para el usuario
import { Index } from './web/index/index';
import { Nosotros } from './web/nosotros/nosotros';
import { Servicios } from './web/servicios/servicios';
import { Solicitar } from './web/solicitar/solicitar';

// Sistema para Trabajadores
import { Login } from './sistema/login/login';
import { Menu } from './sistema/menu/menu';
import { Pacientes } from './sistema/pacientes/pacientes';
import { Citas } from './sistema/citas/citas';
import { Historia } from './sistema/historia/historia';



export const routes: Routes = [
    // Web para el usuario
    {path: 'index', component: Index },
    {path: 'nosotros', component: Nosotros },
    {path: 'servicios', component: Servicios },
    {path: 'solicitar', component: Solicitar },
    
    
    // Sistema para Trabajadores
    {path: 'login', component: Login },
    {path: 'menu', component: Menu },
    {path: 'pacientes', component: Pacientes },
    {path: 'citas', component: Citas },
    {path: 'historia', component: Historia },


    { path: '**', redirectTo: 'index' }
];
