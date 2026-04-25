const ESTADOS = ["Pendiente", "Asignado", "En ruta", "Entregado"];

function mostrarMensaje(idElemento, texto, tipo = "ok") {
  const elemento = document.getElementById(idElemento);
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.classList.remove("oculto", "ok", "error");
  elemento.classList.add(tipo);
}

function limpiarMensaje(idElemento) {
  const elemento = document.getElementById(idElemento);
  if (!elemento) return;
  elemento.textContent = "";
  elemento.classList.add("oculto");
  elemento.classList.remove("ok", "error");
}

function claseEstado(estado) {
  const normalizado = String(estado || "")
    .trim()
    .toLowerCase();

  if (normalizado === "pendiente") return "estado-pendiente";
  if (normalizado === "asignado") return "estado-asignado";
  if (normalizado === "en ruta") return "estado-en-ruta";
  if (normalizado === "entregado") return "estado-entregado";
  return "estado-pendiente";
}

async function parsearRespuesta(respuesta) {
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const mensaje =
      data.error || data.message || "Ocurrio un error en la solicitud.";
    throw new Error(mensaje);
  }
  return data;
}

async function registrarPaquete(evento) {
  evento.preventDefault();
  limpiarMensaje("mensaje-registro");

  const formulario = evento.target;
  const datosFormulario = new FormData(formulario);

  const payload = {
    numeroGuia: String(datosFormulario.get("numeroGuia") || "").trim(),
    remitente: String(datosFormulario.get("remitente") || "").trim(),
    destinatario: String(datosFormulario.get("destinatario") || "").trim(),
    direccionDestino: String(
      datosFormulario.get("direccionDestino") || ""
    ).trim(),
  };

  if (!payload.numeroGuia) {
    delete payload.numeroGuia;
  }

  try {
    const respuesta = await fetch("/api/paquetes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const paquete = await parsearRespuesta(respuesta);
    mostrarMensaje(
      "mensaje-registro",
      `Envio creado correctamente. Guia: ${paquete.numeroGuia}`,
      "ok"
    );
    formulario.reset();
  } catch (error) {
    mostrarMensaje("mensaje-registro", error.message, "error");
  }
}

function construirOpcionesEstado(estadoActual) {
  return ESTADOS.map((estado) => {
    const selected = estado === estadoActual ? "selected" : "";
    return `<option value="${estado}" ${selected}>${estado}</option>`;
  }).join("");
}

function renderResumen(paquetes) {
  const contenedor = document.getElementById("resumen-estados");
  if (!contenedor) return;

  const conteo = {
    Total: paquetes.length,
    Pendiente: 0,
    Asignado: 0,
    "En ruta": 0,
    Entregado: 0,
  };

  for (const paquete of paquetes) {
    if (conteo[paquete.estado] !== undefined) {
      conteo[paquete.estado] += 1;
    }
  }

  contenedor.innerHTML = Object.entries(conteo)
    .map(
      ([label, valor]) => `
      <article class="resumen-item">
        <h3>${label}</h3>
        <strong>${valor}</strong>
      </article>
    `
    )
    .join("");
}

function renderTablaPaquetes(paquetes) {
  const tbody = document.getElementById("tabla-paquetes");
  if (!tbody) return;

  if (paquetes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No hay paquetes registrados todavia.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = paquetes
    .map(
      (paquete) => `
      <tr data-guia="${paquete.numeroGuia}">
        <td><strong>${paquete.numeroGuia}</strong></td>
        <td>${paquete.remitente}</td>
        <td>${paquete.destinatario}</td>
        <td>${paquete.direccionDestino}</td>
        <td>
          <span class="badge ${claseEstado(paquete.estado)}">${paquete.estado}</span>
          <div style="margin-top:8px;">
            <select class="selector-estado">
              ${construirOpcionesEstado(paquete.estado)}
            </select>
          </div>
        </td>
        <td>
          <button class="btn-accion" data-action="guardar-estado" type="button">
            Actualizar
          </button>
        </td>
      </tr>
    `
    )
    .join("");
}

async function cargarPaquetesAdmin() {
  try {
    const respuesta = await fetch("/api/paquetes");
    const paquetes = await parsearRespuesta(respuesta);
    renderResumen(paquetes);
    renderTablaPaquetes(paquetes);
  } catch (error) {
    mostrarMensaje("mensaje-admin", error.message, "error");
  }
}

async function actualizarEstadoDesdeFila(fila) {
  const guia = fila.dataset.guia;
  const selectorEstado = fila.querySelector(".selector-estado");
  if (!guia || !selectorEstado) return;

  try {
    const respuesta = await fetch(`/api/paquetes/${encodeURIComponent(guia)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: selectorEstado.value }),
    });

    await parsearRespuesta(respuesta);
    mostrarMensaje("mensaje-admin", `Estado actualizado para la guia ${guia}.`, "ok");
    await cargarPaquetesAdmin();
  } catch (error) {
    mostrarMensaje("mensaje-admin", error.message, "error");
  }
}

async function consultarRastreo(evento) {
  evento.preventDefault();
  limpiarMensaje("mensaje-rastreo");
  const resultado = document.getElementById("resultado-rastreo");
  const guiaInput = document.getElementById("numeroGuiaConsulta");

  if (!resultado || !guiaInput) return;
  resultado.innerHTML = "";

  const guia = guiaInput.value.trim().toUpperCase();
  if (!guia) {
    mostrarMensaje("mensaje-rastreo", "Ingresa un numero de guia.", "error");
    return;
  }

  try {
    const respuesta = await fetch(`/api/paquetes/${encodeURIComponent(guia)}`);
    const paquete = await parsearRespuesta(respuesta);

    resultado.innerHTML = `
      <article class="resultado-card">
        <p><strong>Guia:</strong> ${paquete.numeroGuia}</p>
        <p><strong>Remitente:</strong> ${paquete.remitente}</p>
        <p><strong>Destinatario:</strong> ${paquete.destinatario}</p>
        <p><strong>Direccion:</strong> ${paquete.direccionDestino}</p>
        <p>
          <strong>Estado actual:</strong>
          <span class="badge ${claseEstado(paquete.estado)}">${paquete.estado}</span>
        </p>
      </article>
    `;
    mostrarMensaje("mensaje-rastreo", "Consulta realizada con exito.", "ok");
  } catch (error) {
    mostrarMensaje("mensaje-rastreo", error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pagina = document.body.dataset.page;

  if (pagina === "registro") {
    const formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
      formRegistro.addEventListener("submit", registrarPaquete);
    }
  }

  if (pagina === "admin") {
    cargarPaquetesAdmin();

    const btnRecargar = document.getElementById("btn-recargar");
    if (btnRecargar) {
      btnRecargar.addEventListener("click", () => {
        limpiarMensaje("mensaje-admin");
        cargarPaquetesAdmin();
      });
    }

    const tabla = document.getElementById("tabla-paquetes");
    if (tabla) {
      tabla.addEventListener("click", (evento) => {
        const boton = evento.target.closest("button[data-action='guardar-estado']");
        if (!boton) return;
        const fila = boton.closest("tr");
        if (fila) {
          actualizarEstadoDesdeFila(fila);
        }
      });
    }

    setInterval(cargarPaquetesAdmin, 8000);
  }

  if (pagina === "rastreo") {
    const formRastreo = document.getElementById("form-rastreo");
    if (formRastreo) {
      formRastreo.addEventListener("submit", consultarRastreo);
    }
  }
});
