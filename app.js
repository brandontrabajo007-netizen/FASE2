const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "paquetes.json");
const ESTADOS_VALIDOS = ["Pendiente", "Asignado", "En ruta", "Entregado"];

let paquetes = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function cargarPaquetes() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }

  try {
    const contenido = await fs.readFile(DATA_FILE, "utf-8");
    const datos = JSON.parse(contenido);
    paquetes = Array.isArray(datos) ? datos : [];
  } catch {
    paquetes = [];
  }
}

async function guardarPaquetes() {
  await fs.writeFile(DATA_FILE, JSON.stringify(paquetes, null, 2), "utf-8");
}

function generarNumeroGuia() {
  let guia = "";
  do {
    guia = `RR${Math.floor(100000 + Math.random() * 900000)}`;
  } while (paquetes.some((paquete) => paquete.numeroGuia === guia));
  return guia;
}

function textoValido(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

function buscarPaquetePorGuia(guia) {
  return paquetes.find((paquete) => paquete.numeroGuia === guia);
}

app.post("/api/paquetes", async (req, res) => {
  try {
    const { numeroGuia, remitente, destinatario, direccionDestino, estado } =
      req.body;

    if (
      !textoValido(remitente) ||
      !textoValido(destinatario) ||
      !textoValido(direccionDestino)
    ) {
      return res.status(400).json({
        error:
          "Faltan datos obligatorios: remitente, destinatario y direccionDestino.",
      });
    }

    const guiaFinal = textoValido(numeroGuia)
      ? numeroGuia.trim().toUpperCase()
      : generarNumeroGuia();

    if (buscarPaquetePorGuia(guiaFinal)) {
      return res.status(400).json({
        error: "El numeroGuia ya existe. Debe ser unico.",
      });
    }

    const estadoFinal = textoValido(estado) ? estado.trim() : "Pendiente";

    if (!ESTADOS_VALIDOS.includes(estadoFinal)) {
      return res.status(400).json({
        error: `Estado invalido. Usa: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const marcaTiempo = new Date().toISOString();

    const nuevoPaquete = {
      numeroGuia: guiaFinal,
      remitente: remitente.trim(),
      destinatario: destinatario.trim(),
      direccionDestino: direccionDestino.trim(),
      estado: estadoFinal,
      fechaCreacion: marcaTiempo,
      fechaActualizacion: marcaTiempo,
      historial: [
        {
          estado: estadoFinal,
          fecha: marcaTiempo,
        },
      ],
    };

    paquetes.unshift(nuevoPaquete);
    await guardarPaquetes();

    return res.status(201).json(nuevoPaquete);
  } catch {
    return res.status(500).json({ error: "Error interno al crear el paquete." });
  }
});

app.get("/api/paquetes", (req, res) => {
  return res.json(paquetes);
});

app.get("/api/paquetes/:guia", (req, res) => {
  const guia = String(req.params.guia || "").trim().toUpperCase();
  const paquete = buscarPaquetePorGuia(guia);

  if (!paquete) {
    return res.status(404).json({ error: "Paquete no encontrado." });
  }

  return res.json(paquete);
});

app.put("/api/paquetes/:guia", async (req, res) => {
  try {
    const guia = String(req.params.guia || "").trim().toUpperCase();
    const paquete = buscarPaquetePorGuia(guia);

    if (!paquete) {
      return res.status(404).json({ error: "Paquete no encontrado." });
    }

    const { estado } = req.body;

    if (!textoValido(estado)) {
      return res
        .status(400)
        .json({ error: "Debes enviar el estado para actualizar." });
    }

    const estadoNormalizado = estado.trim();
    if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
      return res.status(400).json({
        error: `Estado invalido. Usa: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const ahora = new Date().toISOString();
    paquete.estado = estadoNormalizado;
    paquete.fechaActualizacion = ahora;
    paquete.historial.push({ estado: estadoNormalizado, fecha: ahora });

    await guardarPaquetes();
    return res.json(paquete);
  } catch {
    return res
      .status(500)
      .json({ error: "Error interno al actualizar el paquete." });
  }
});

app.use("/api", (req, res) => {
  return res.status(404).json({ error: "Ruta API no encontrada." });
});

async function iniciarServidor() {
  await cargarPaquetes();
  app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
  });
}

iniciarServidor();

