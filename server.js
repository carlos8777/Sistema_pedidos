require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verificarToken, soloAdmin, supabaseAdmin } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
    console.error('ERROR: Faltan SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY en tu archivo .env');
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
});

app.get('/api/auth/perfil', verificarToken, (req, res) => {
    res.json({ usuario: req.usuario });
})

app.get('/api/pedidos', verificarToken, soloAdmin, async (req, res) => {
    const { fecha } = req.query;
    let query = supabaseAdmin.from ('pedidos').select('*');

    if(fecha){
        query = query.eq('fecha', fecha);
    }

    const { data, error } = await query.order('horario', { ascending: true});

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

//Crear un nuevo pedido

app.post('/api/pedidos', verificarToken, async (req, res) => {
    const { fecha, metros, cliente, direccion, resistencia, horario } = req.body;

    const { data, error } = await supabaseAdmin
        .from('pedidos')
        .insert([{ fecha, metros, cliente, direccion, resistencia, horario}])
        .select();
        
    if(error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

//Editar un pedido

app.put('/api/pedidos/:id', verificarToken, soloAdmin, async (req, res) => {
    const { id } =req.params;
    const { fecha, metros, cliente, direccion, resistencia, horario } = req.body;

    const { data, error } = await supabaseAdmin
        .from('pedidos')
        .update({ fecha, metros, cliente, direccion, resistencia, horario })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

//Borrar un pedido

app.delete('/api/pedidos/:id', verificarToken, soloAdmin, async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
    .from('pedidos')
    .delete()
    .eq('id', id);

    if(error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Pedido eliminado correctamente'});
});

app.listen(port, () => {
    console.log(`Servidor activo en el puerto ${port}`)
})