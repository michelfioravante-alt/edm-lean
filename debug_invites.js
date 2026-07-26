const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("--- Verificando Empresas ---");
    const { data, error } = await supabase.from('empresas').select('id, nome_fantasia, codigo_convite');
    if (error) {
        console.error("Erro ao buscar empresas (Pode ser RLS):", error.message);
    } else {
        console.log("Empresas encontradas:", data.length);
        data.forEach(e => {
            console.log(`ID: ${e.id} | Nome: ${e.nome_fantasia} | Convite: ${e.codigo_convite}`);
        });
    }
}

check();
