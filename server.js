require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/api/pedidos', async (req, res) => {
    const { fecha } = req.query;
    let query = supabase.from('pedidos').select('*');

    if(fecha){
        query = query.eq('fecha', fecha);
    }

    const { data, error } = await query.order('horario', { ascending: true});

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

//Crear un nuevo pedido

app.post('/api/pedidos', async (req, res) => {
    const { fecha, metros, cliente, direccion, resistencia, horario } = req.body;

    const { data, error } = await supabase
        .from('pedidos')
        .insert([{ fecha, metros, cliente, direccion, resistencia, horario}])
        .select();
        
    if(error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

//Editar un pedido

app.put('/api/pedidos/:id', async (req, res) => {
    const { id } =req.params;
    const { fecha, metros, cliente, direccion, resistencia, horario } = req.body;

    const { data, error } = await supabase
        .from('pedidos')
        .update({ fecha, metros, cliente, direccion, resistencia, horario })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

//Borrar un pedido

app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);

    if(error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Pedido eliminado correctamente'});
});

app.listen(port, () => {
    console.log(`Servidor activo en el puerto ${port}`)
})