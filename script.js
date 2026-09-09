let pedidoSeleccionado = null;
let listaPedido = [];

const formPedido = document.getElementById('form-pedido');
const formTitle = document.getElementById('form-title');
const inputPedido = document.getElementById('pedido-id');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');

const inputFiltroFecha = document.getElementById('filtro-fecha');
const btnBuscar = document.getElementById('buscar');
const btnModificar = document.getElementById('editar');
const btnBorrar = document.getElementById('eliminar');
const tbodyPedidos = document.getElementById('tbody-pedidos');

const hoy = new Date().toISOString().split('T')[0];
inputFiltroFecha.value = hoy;

//Formato para las fechas DD/MM/AAAA

function formatoFecha(fechaISO){
    if(!fechaISO) return '';
    const partes = fechaISO.split('-');
    if(partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

//Boton para buscar

btnBuscar.addEventListener('click', async () => {
    const fecha = inputFiltroFecha.value;
    if(!fecha){
        alert('Seleccione una fecha para consultar.');
        return;
    }
    await cargarPedidos(fecha);
});

async function cargarPedidos(fecha = ''){
    tbodyPedidos.innerHTML = '<tr><td colspan="7" class="text-center"Cargando...</td></tr>';
    deseleccionarPedido();

    try{
        const url = fecha ? `/api/pedidos?fecha=${fecha}` : '/api/pedidos';
        const res = await fetch(url);
        const pedidos = await res.json();

        listaPedido = pedidos;
        renderTabla(pedidos);
    }catch(error){
        console.error('Error al cargar pedidos:', error);
        tbodyPedidos.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los datos</td></tr>';
    }
}

function renderTabla(pedidos){
    if(pedidos.length === 0){
        tbodyPedidos.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos agendados para esta fecha.</td></tr>';
        return;
    }

    tbodyPedidos.innerHTML = '';
    pedidos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = p.id;

        tr.innerHTML = `
            <td><input type="radio" name="select-pedido" value="${p.id}" onclick="marcarSeleccion(${p.id})"></td>
            <td><strong>${formatearFechaUI(p.fecha)}</strong></td>
            <td>${p.horario}</td>
            <td>${p.cliente}</td>
            <td>${p.metros} m³</td>
            <td>${p.resistencia}</td>
            <td>${p.direccion}</td>
            `;
            tbodyPedidos.appendChild(tr);
    });
}

//Seleccion de fila

windows.marcarSeleccion = function(id) {
    pedidoSeleccionado = listaPedido.find(p => p.id === id);
    btnModificar.disabled = false;
    btnBorrar.disabled = false;
}

function deseleccionarPedido(){
    pedidoSelecionado = null;
    btnModificar.disabled = true;
    btnBorrar.disabled = true;
    const radio = document.querySelector('input[name="select-pedido": checked]');
    if(radio) radio.checked = false;
}

//Crear y editar formulario

formPedido.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = inputPedidoId.value;
    const datos = {
        fecha: document.getElementById('fecha').value,
        horario: document.getElementById('horario').value,
        cliente: document.getElementById('cliente').value.trim(),
        metros: parseFloat(document.getElementById('metros').value),
        resistencia: document.getElementById('resistencia').value.trim(),
        direccion: document.getElementById('direccion').value.trim()
    };

    try{
        let res;
        if(id){
            res = await fetch(`/api/pedidos/${id}`, {
                method : 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(datos)
            });
        }else{
            res = await fetch(`/api/pedidos/${id}`, {
                method : 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(datos)
            });
        }

        if(res.ok){
            alert(id ? 'Pedido actualizado con éxito' : 'Pedido registrado con éxito');
            limpiarFormulario();
            inputFiltroFecha.value = datos.fecha;
            await cargarPedidos(datos.fecha);
        }else{
            const err = await res.json();
            alert(`Error: ${err.error}`);
        }
    }catch(error){
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al procesar el pedido.')
    }
});

//Boton de editar

btnModificar.addEventListener('click', () => {
    if(pedidoSeleccionado) return;

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

btnCancelar.addEventListener('click', limpiarFormulario);

function limpiarFormulario(){
    inputPedidoId.value = '';
    formPedido.reset();
    formTitle.textContent = 'Nuevo pedido';
    btnGuardar. textContent = 'Guardar Pedido';
    btnCancelar.style.display = 'none';
}

// Boton Borrar Seleccionado
btnBorrar.addEventListener('click', async () => {
  if (!pedidoSeleccionado) return;

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar el pedido del cliente "${pedidoSeleccionado.cliente}"?`);
  if (!confirmacion) return;

  try {
    const res = await fetch(`/api/pedidos/${pedidoSeleccionado.id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      alert('Pedido eliminado correctamente.');
      const fechaGuardada = inputFiltroFecha.value;
      await cargarPedidos(fechaGuardada);
    } else {
      const err = await res.json();
      alert(`Error al eliminar: ${err.error}`);
    }
  } catch (error) {
    console.error('Error al borrar:', error);
    alert('Ocurrió un error al intentar eliminar el pedido.');
  }
});

cargarPedidos(hoy);