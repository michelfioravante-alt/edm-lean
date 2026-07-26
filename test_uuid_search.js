const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const testPrefix = "72bb4f1e"; // From the user's METINDEXTESTE company
    console.log(`Testando busca por prefixo: ${testPrefix}`);

    const { data, error } = await supabase
        .from('empresas')
        .select('id, nome_fantasia')
        .ilike('id', `${testPrefix}%`);

    if (error) {
        console.error("Erro na busca ilike:", error.message);
    } else {
        console.log("Resultado ilike:", data);
    }

    // Tentativa com cast via string filter
    const { data: d2, error: e2 } = await supabase
        .from('empresas')
        .select('id')
        .filter('id', 'like', `${testPrefix}%`);

    if (e2) console.error("Erro filter like:", e2.message);
    else console.log("Resultado filter like:", d2);
}

test();
