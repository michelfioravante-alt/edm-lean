const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function audit() {
    console.log("--- Audit de Empresas ---");
    const { data: companies, error: cErr } = await supabase.from('empresas').select('*');
    if (cErr) console.error(cErr);
    else {
        companies.forEach(c => {
            console.log(`Empresa: [${c.nome_fantasia}] ID: ${c.id} Code: ${c.codigo_convite}`);
        });
    }

    console.log("\n--- Audit de Usuários (Perfis) ---");
    const { data: profiles, error: pErr } = await supabase.from('perfis').select('*');
    if (pErr) console.error(pErr);
    else {
        profiles.forEach(p => {
            console.log(`User: ${p.nome} Role: ${p.funcao} CompanyID: ${p.empresa_id}`);
        });
    }
}

audit();
