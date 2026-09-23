let pedidoSeleccionado = null;
let listaPedido = [];
let esAdmin = false;

// Elementos del DOM
const formPedido = document.getElementById('form-pedido');
const formTitle = document.getElementById('form-title');
const inputPedidoId = document.getElementById('pedido-id'); // Nombre de variable unificado
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

const inputFiltroFecha = document.getElementById('filtro-fecha');
const btnBuscar = document.getElementById('buscar');
const btnModificar = document.getElementById('editar');
const btnBorrar = document.getElementById('eliminar');
const tbodyPedidos = document.getElementById('tbody-pedidos');

const hoy = new Date().toISOString().split('T')[0];
if (inputFiltroFecha) {
    inputFiltroFecha.value = hoy;
}

// Formato de fecha para la tabla (DD/MM/AAAA)
function formatoFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Buscar pedidos por fecha
if (btnBuscar){
    btnBuscar.addEventListener('click', async () => {
        const fecha = inputFiltroFecha.value;
        if (!fecha) {
            alert('Seleccione una fecha para consultar.');
            return;
        }
        await cargarPedidos(fecha);
    });
}

// Cargar pedidos desde el servidor
async function cargarPedidos(fecha = '') {
    if(!esAdmin) return;

    tbodyPedidos.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
    deseleccionarPedido();

    try {
        const url = fecha ? `/api/pedidos?fecha=${fecha}` : '/api/pedidos';
        const res = await fetch(url, { headers: await authHeaders() });
        
        if (await manejarRespuestaAuth(res)) return;

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error en el servidor al consultar pedidos.');
        }

        const pedidos = await res.json();
        listaPedido = pedidos;
        renderTabla(pedidos);
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        tbodyPedidos.innerHTML = `<tr><td colspan="7" class="text-center" style="color: red;">${error.message}</td></tr>`;
    }
}

// Renderizar filas de la tabla
function renderTabla(pedidos) {
    if (!pedidos || pedidos.length === 0) {
        tbodyPedidos.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos agendados para esta fecha.</td></tr>';
        return;
    }

    tbodyPedidos.innerHTML = '';
    pedidos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = p.id;

        tr.innerHTML = `
            <td><input type="radio" name="select-pedido" value="${p.id}" onclick="marcarSeleccion(${p.id})"></td>
            <td><strong>${formatoFecha(p.fecha)}</strong></td>
            <td>${p.horario || ''}</td>
            <td>${p.metros} m³</td>
            <td>${p.cliente}</td>
            <td>${p.direccion}</td>
            <td>${p.resistencia}</td>
        `;
        tbodyPedidos.appendChild(tr);
    });
}

// Seleccionar fila
window.marcarSeleccion = function(id) {
    pedidoSeleccionado = listaPedido.find(p => p.id === id);
    if (btnModificar) btnModificar.disabled = false;
    if (btnBorrar) btnBorrar.disabled = false;
};

// Deseleccionar fila (Selector CSS corregido)
function deseleccionarPedido() {
    pedidoSeleccionado = null;
    if (btnModificar) btnModificar.disabled = true;
    if (btnBorrar) btnBorrar.disabled = true;
    
    const radio = document.querySelector('input[name="select-pedido"]:checked');
    if (radio) radio.checked = false;
}

// Guardar / Editar pedido
formPedido.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = inputPedidoId ? inputPedidoId.value : '';

    const datos = {
        fecha: document.getElementById('fecha').value,
        horario: document.getElementById('horario').value,
        cliente: document.getElementById('cliente').value.trim(),
        metros: parseFloat(document.getElementById('metros').value),
        resistencia: document.getElementById('resistencia').value.trim(),
        direccion: document.getElementById('direccion').value.trim()
    };

    try {
        let res;
        if (id) {
            res = await fetch(`/api/pedidos/${id}`, {
                method: 'PUT',
                headers: await authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(datos)
            });
        } else {
            res = await fetch('/api/pedidos', {
                method: 'POST',
                headers: await authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(datos)
            });
        }

        if(await manejarRespuestaAuth(res)) return;

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Operación exitosa',
                text: id ? 'Pedido actualizado correctamente' : 'Pedido registrado correctamente',
                timer: 2000,
                showConfirmButton: false
            });
            limpiarFormulario();
            if(esAdmin){
                if (inputFiltroFecha) inputFiltroFecha.value = datos.fecha;
                await cargarPedidos(datos.fecha);
            }
        } else {
            const err = await res.json();
            alert(`Error del servidor: ${err.error || 'No se pudo guardar el pedido'}`);
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al procesar el pedido.',
            confirmButtonColor: '#007bff'
        });
    }
});

// Botón de editar
if(btnModificar){
    btnModificar.addEventListener('click', () => {
        if (!pedidoSeleccionado) return;

        inputPedidoId.value = pedidoSeleccionado.id;
        document.getElementById('fecha').value = pedidoSeleccionado.fecha;
        document.getElementById('horario').value = pedidoSeleccionado.horario;
        document.getElementById('cliente').value = pedidoSeleccionado.cliente;
        document.getElementById('metros').value = pedidoSeleccionado.metros;
        document.getElementById('resistencia').value = pedidoSeleccionado.resistencia;
        document.getElementById('direccion').value = pedidoSeleccionado.direccion;

        formTitle.textContent = 'Editando pedido';
        btnGuardar.textContent = 'Actualizar pedido';
        btnCancelar.style.display = 'inline-block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

btnCancelar.addEventListener('click', limpiarFormulario);

function limpiarFormulario() {
    if (inputPedidoId) inputPedidoId.value = '';
    formPedido.reset();
    formTitle.textContent = 'Nuevo pedido';
    btnGuardar.textContent = 'Guardar Pedido';
    btnCancelar.style.display = 'none';
}

// Botón Borrar
if(btnBorrar){
    btnBorrar.addEventListener('click', async () => {
        if (!pedidoSeleccionado) return;

        const result = await Swal.fire({
            title: '¿Confirmas la eliminación?',
            text: `Se eliminará el pedido del cliente "${pedidoSeleccionado.cliente}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/pedidos/${pedidoSeleccionado.id}`, { 
                    method: 'DELETE',
                    headers: await authHeaders()
                });

                if(await manejarRespuestaAuth(res)) return;

                if (res.ok) {
                    Swal.fire('¡Eliminado!', 'El pedido ha sido eliminado.', 'success');
                    await cargarPedidos(inputFiltroFecha.value);
                } else {
                    const err = await res.json();
                    Swal.fire('Error', err.error || 'No se pudo eliminar.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Ocurrió un error al intentar eliminar el pedido.', 'error');
            }
        }
    });
}

async function iniciar(){
    const usuario = await inicializarSesion();
    if(!usuario) return;

    esAdmin = usuario.rol === 'admin';

    const seccionConsulta = document.getElementById('seccion-consulta');
    if(!esAdmin && seccionConsulta){
        seccionConsulta.style.display = 'none';
    }

    if(esAdmin) {
        await cargarPedidos(hoy);
    }
}

iniciar();