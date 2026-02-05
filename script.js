// Array para almacenar los participantes
let participantes = [];

// Elementos del DOM
const nombreInput = document.getElementById('nombreInput');
const montoInput = document.getElementById('montoInput');
const agregarBtn = document.getElementById('agregarBtn');
const participantesList = document.getElementById('participantesList');
const calcularBtn = document.getElementById('calcularBtn');
const limpiarBtn = document.getElementById('limpiarBtn');
const resultadosDiv = document.getElementById('resultados');
const totalGastadoSpan = document.getElementById('totalGastado');
const porPersonaSpan = document.getElementById('porPersona');
const transferenciasDiv = document.getElementById('transferencias');

// Event Listeners
agregarBtn.addEventListener('click', agregarParticipante);
calcularBtn.addEventListener('click', calcularDivision);
limpiarBtn.addEventListener('click', limpiarTodo);

// Permitir agregar con Enter
nombreInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarParticipante();
});

montoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarParticipante();
});

// Función para agregar participante
function agregarParticipante() {
    const nombre = nombreInput.value.trim();
    const monto = parseFloat(montoInput.value);

    // Validaciones
    if (!nombre) {
        alert('Por favor ingresa un nombre');
        return;
    }

    if (isNaN(monto) || monto < 0) {
        alert('Por favor ingresa un monto válido');
        return;
    }

    // Verificar si el participante ya existe
    const existe = participantes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
        alert('Este participante ya existe');
        return;
    }

    // Agregar participante
    participantes.push({ nombre, monto });

    // Limpiar inputs
    nombreInput.value = '';
    montoInput.value = '';
    nombreInput.focus();

    // Actualizar la lista
    actualizarListaParticipantes();

    // Ocultar resultados
    resultadosDiv.style.display = 'none';
}

// Función para actualizar la lista de participantes
function actualizarListaParticipantes() {
    if (participantes.length === 0) {
        participantesList.innerHTML = '<p class="mensaje-vacio">No hay participantes agregados</p>';
        return;
    }

    participantesList.innerHTML = '';
    participantes.forEach((participante, index) => {
        const div = document.createElement('div');
        div.className = 'participante-item';
        div.innerHTML = `
            <div class="participante-info">
                <span class="participante-nombre">${participante.nombre}</span>
                <span class="participante-monto">$${participante.monto.toFixed(2)}</span>
            </div>
            <button class="btn-eliminar" onclick="eliminarParticipante(${index})">Eliminar</button>
        `;
        participantesList.appendChild(div);
    });
}

// Función para eliminar participante
function eliminarParticipante(index) {
    participantes.splice(index, 1);
    actualizarListaParticipantes();
    resultadosDiv.style.display = 'none';
}

// Función para calcular la división
function calcularDivision() {
    if (participantes.length === 0) {
        alert('Debes agregar al menos un participante');
        return;
    }

    // Calcular total gastado
    const totalGastado = participantes.reduce((sum, p) => sum + p.monto, 0);

    // Calcular monto por persona
    const porPersona = totalGastado / participantes.length;

    // Calcular balances
    const balances = participantes.map(p => ({
        nombre: p.nombre,
        pagado: p.monto,
        balance: p.monto - porPersona
    }));

    // Separar quienes deben recibir y quienes deben pagar
    const debenRecibir = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debenPagar = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

    // Mostrar resumen
    totalGastadoSpan.textContent = totalGastado.toFixed(2);
    porPersonaSpan.textContent = porPersona.toFixed(2);

    // Generar transferencias
    transferenciasDiv.innerHTML = '';

    if (debenRecibir.length === 0 && debenPagar.length === 0) {
        transferenciasDiv.innerHTML = '<p class="mensaje-vacio">✓ Todos pagaron exactamente lo mismo. No hay transferencias necesarias.</p>';
    } else {
        // Mostrar quienes deben recibir
        debenRecibir.forEach(persona => {
            const div = document.createElement('div');
            div.className = 'transferencia-item recibe';
            div.innerHTML = `
                <div class="transferencia-texto">
                    <strong>${persona.nombre}</strong> debe RECIBIR:
                </div>
                <div class="transferencia-monto">$${Math.abs(persona.balance).toFixed(2)}</div>
            `;
            transferenciasDiv.appendChild(div);
        });

        // Mostrar quienes deben pagar
        debenPagar.forEach(persona => {
            const div = document.createElement('div');
            div.className = 'transferencia-item paga';
            div.innerHTML = `
                <div class="transferencia-texto">
                    <strong>${persona.nombre}</strong> debe PAGAR:
                </div>
                <div class="transferencia-monto">$${Math.abs(persona.balance).toFixed(2)}</div>
            `;
            transferenciasDiv.appendChild(div);
        });

        // Generar transferencias óptimas
        const transferencias = calcularTransferenciasOptimas(debenPagar, debenRecibir);
        
        if (transferencias.length > 0) {
            const divSeparador = document.createElement('div');
            divSeparador.innerHTML = '<h3 style="margin-top: 20px; margin-bottom: 15px; color: #667eea;">Transferencias Sugeridas:</h3>';
            transferenciasDiv.appendChild(divSeparador);

            transferencias.forEach(t => {
                const div = document.createElement('div');
                div.className = 'transferencia-item';
                div.style.borderLeftColor = '#667eea';
                div.innerHTML = `
                    <div class="transferencia-texto">
                        ${t.de} → ${t.para}
                    </div>
                    <div class="transferencia-monto">$${t.monto.toFixed(2)}</div>
                `;
                transferenciasDiv.appendChild(div);
            });
        }
    }

    // Mostrar resultados
    resultadosDiv.style.display = 'block';
    resultadosDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Función para calcular transferencias óptimas
function calcularTransferenciasOptimas(debenPagar, debenRecibir) {
    const transferencias = [];
    
    // Copiar arrays para no modificar los originales
    const pagadores = debenPagar.map(p => ({ ...p, balance: Math.abs(p.balance) }));
    const receptores = debenRecibir.map(r => ({ ...r }));

    let i = 0;
    let j = 0;

    while (i < pagadores.length && j < receptores.length) {
        const pagador = pagadores[i];
        const receptor = receptores[j];

        const monto = Math.min(pagador.balance, receptor.balance);

        if (monto > 0.01) {
            transferencias.push({
                de: pagador.nombre,
                para: receptor.nombre,
                monto: monto
            });

            pagador.balance -= monto;
            receptor.balance -= monto;
        }

        if (pagador.balance < 0.01) i++;
        if (receptor.balance < 0.01) j++;
    }

    return transferencias;
}

// Función para limpiar todo
function limpiarTodo() {
    if (participantes.length > 0) {
        if (confirm('¿Estás seguro de que quieres eliminar todos los participantes?')) {
            participantes = [];
            actualizarListaParticipantes();
            resultadosDiv.style.display = 'none';
            nombreInput.value = '';
            montoInput.value = '';
        }
    }
}

// Inicializar la vista
actualizarListaParticipantes();
