# Nuvic · Compara precios en el campus

Página web de Nuvic para estudiantes de la UCA: compara precios de farmacias, librerías, copias, florerías, salones, barberías, lavanderías y gasolineras cerca del campus.

**Versión para GitHub Pages.** Toda la página corre en el navegador:

- Los comercios, productos, precios, ofertas y recompensas están en `js/datos.js`.
- Las cuentas, Mi lista, los puntos, los canjes y la membresía se guardan en el navegador de cada persona (localStorage). Es una demo: no hay servidor, no se envían correos y no se cobra nada.
- Cuenta de prueba: **ana.martinez@uca.edu.sv** · **Nuvic2026**
- Tarjeta de prueba para Nuvic Plus: **4242 4242 4242 4242**, cualquier fecha futura y CVV de 3 números. No escribas datos de una tarjeta real.
- Códigos de compra de prueba: NV-FR10 · NV-LI65 · NV-CC01 · NV-LM25 · NV-GU20.
- Desde Perfil se puede usar "Reiniciar la demo" para volver a los datos iniciales.

## Estructura

| Archivo | Qué hace |
|---|---|
| `*.html` | Una por pantalla; solo indican qué página es (`<body data-page="...">`) |
| `js/sitio.js` | Dibuja cada pantalla y maneja login, lista, puntos, canjes, membresía y ofertas |
| `js/datos.js` | Datos de comercios, productos y precios |
| `js/app.js` | Menú lateral, avisos, sugerencias al buscar, requisitos de contraseña, mascota animada |
| `nuvic.css` | Estilos |
| `img/` | Logo, íconos, fotos de comercios, ilustraciones y mascota |

## Publicar en GitHub Pages

1. Sube todos estos archivos a la raíz de un repositorio público.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama **main**, carpeta **/ (root)** y **Save**.
3. Espera 1 o 2 minutos. La página queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

La versión con base de datos (PHP + MySQL para XAMPP) está en otro proyecto: GitHub Pages no puede correr PHP.
