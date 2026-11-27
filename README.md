# Nuvic · Compara precios en el campus

Página web de Nuvic para estudiantes de la UCA: compara precios de farmacias, librerías, copias, florerías, salones, barberías, lavanderías y gasolineras cerca del campus.

**Versión para GitHub Pages.** Toda la página corre en el navegador:

- Los comercios, productos, precios, ofertas y recompensas están en `js/datos.js`.
- Las cuentas, Mi lista, los puntos, los canjes y la membresía se guardan en el navegador de cada persona (localStorage). Es una demo: no hay servidor, no se envían correos y no se cobra nada.
- Cuenta de prueba: **ana.martinez@uca.edu.sv** · **Nuvic2026**
- Tarjeta de prueba para Nuvic Plus: **4242 4242 4242 4242**, cualquier fecha futura y CVV de 3 números. No escribas datos de una tarjeta real.
- **Escanear QR con la cámara:** en *Mis puntos → Escanear QR*, toca el recuadro, da permiso a la cámara y apunta a un código de prueba. Los 12 códigos están en `codigos-qr.html` (y en el PDF para imprimir). También se pueden escanear con la cámara normal del celular: el QR abre `escanear-qr.html?codigo=…` y suma los puntos. Cada código suma una sola vez por cuenta.
  - La cámara solo funciona con `https://` (GitHub Pages ya lo usa) o en `localhost`.
  - Para leer el QR se usa el lector del navegador (BarcodeDetector) o, si no existe, la librería jsQR desde cdn.jsdelivr.net.
- Desde Perfil se puede usar "Reiniciar la demo" para volver a los datos iniciales.

## Estructura

| Archivo | Qué hace |
|---|---|
| `*.html` | Una por pantalla; solo indican qué página es (`<body data-page="...">`) |
| `js/sitio.js` | Dibuja cada pantalla y maneja login, lista, puntos, canjes, membresía y ofertas |
| `js/datos.js` | Datos de comercios, productos y precios |
| `js/app.js` | Menú lateral, avisos, sugerencias al buscar, requisitos de contraseña, mascota animada |
| `nuvic.css` | Estilos |
| `img/` | Logo, íconos, fotos de comercios (`img/fotos`), ilustraciones, mascota y códigos QR (`img/qr`) |

## Publicar en GitHub Pages

1. Sube todos estos archivos a la raíz de un repositorio público.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama **main**, carpeta **/ (root)** y **Save**.
3. Espera 1 o 2 minutos. La página queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

La versión con base de datos (PHP + MySQL para XAMPP) está en otro proyecto: GitHub Pages no puede correr PHP.
