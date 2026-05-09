# Repartos Rapidos SAS - Plataforma de gestion y rastreo de envios

Aplicacion web local para registrar, administrar y rastrear paquetes.

## Stack

- Node.js
- Express
- HTML, CSS y JavaScript (sin frameworks)
- Persistencia local en archivo JSON

## Caracteristicas (MVP)

- Registro de paquetes desde formulario
- Numero de guia unico (manual o autogenerado `RR + 6 digitos`)
- Dashboard admin con lista completa
- Cambio de estado por paquete:
  - Pendiente
  - Asignado
  - En ruta
  - Entregado
- Rastreo publico por numero de guia
- Mensajes de exito y error en pantalla

## Estructura del proyecto

```txt
project/
  app.js
  package.json
  README.md
  data/
    paquetes.json
  public/
    index.html
    admin.html
    rastreo.html
    styles.css
    app.js
```

## Instalacion y ejecucion

1. Inicializar proyecto :
```bash
npm init -y
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar servidor:
```bash
node app.js
```

4. Abrir en navegador:
```txt
http://localhost:3000
```

## Paginas

- `GET /` -> Registro de envios (`index.html`)
- `GET /admin.html` -> Dashboard admin
- `GET /rastreo.html` -> Rastreo publico

## API

- `POST /api/paquetes`
  - Crea un paquete
  - Body minimo:
  ```json
  {
    "remitente": "Juan Perez",
    "destinatario": "Maria Gomez",
    "direccionDestino": "Calle 10 #20-30"
  }
  ```
  - Opcional: `numeroGuia`, `estado`

- `GET /api/paquetes`
  - Lista todos los paquetes

- `GET /api/paquetes/:guia`
  - Consulta un paquete por guia

- `PUT /api/paquetes/:guia`
  - Actualiza estado de un paquete
  - Body:
  ```json
  {
    "estado": "En ruta"
  }
  ```

## Validaciones y errores

- `numeroGuia` debe ser unico
- Campos obligatorios en creacion:
  - `remitente`
  - `destinatario`
  - `direccionDestino`
- Errores manejados:
  - `400` por datos faltantes o invalidos
  - `404` si no existe la guia

## Persistencia

Los datos se guardan en `data/paquetes.json`.  
No usa base de datos.

## Notas

- Proyecto pensado para entorno local y desarrollo academico.
- Todo corre en un solo servidor Express.

## Participantes

Juan Carlos Suarez
Brandon Velandia
Miguel Alejandro Vanegas Carrillo
