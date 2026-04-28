import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment.prod';

const supabaseUrl = environment.supabaseUrl;
const supabaseKey = environment.supabaseKey;

@Injectable
({
    providedIn: 'root',
})

export class SupabaseService
{
    supabase : SupabaseClient<any, "public", any>;
    constructor() 
    {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
}

