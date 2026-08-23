# 🎵 TikTok Live Donation Counter & OBS Overlay

Un sistema interactivo de contador de donaciones en tiempo real para transmisiones de TikTok Live con Overlay transparente para OBS Studio y Dashboard de control con simulador de regalos.

---

## 📖 Guía Paso a Paso: Instalación desde Cero (Desde 0 hasta Transmitir)

Esta guía te asistirá si estás en una computadora totalmente nueva o si acabas de formatear y no tienes ningún programa instalado.

---

### 🔹 PASO 1: Descargar e Instalar los Programas Necesarios

#### 1. Instalar Node.js (Servidor del proyecto)
1. Entra a la página oficial: [nodejs.org](https://nodejs.org)
2. Descarga la versión **LTS** (Recomendada para la mayoría).
3. Ejecuta el instalador descargado. Haz clic en **Next / Siguiente** a todo y asegúrate de mantener marcada la casilla * Add to PATH*. Presiona **Install** y luego **Finish**.

#### 2. Instalar Git (Para clonar el proyecto)
1. Entra a: [git-scm.com](https://git-scm.com)
2. Descarga la versión para Windows y ejecuta el instalador (puedes dejar las opciones por defecto haciendo clic en **Next** a todo).

#### 3. Instalar OBS Studio o TikTok LIVE Studio (Para transmitir)
- **OBS Studio**: Descárgalo desde [obsproject.com](https://obsproject.com)
- **TikTok LIVE Studio**: Descárgalo directamente desde TikTok si ya tienes acceso para emitir desde PC.

---

### 🔹 PASO 2: Descargar el Proyecto a tu Computadora

1. Abre la terminal de tu sistema (**CMD** o **PowerShell**).
2. Ve a la carpeta donde quieras guardar el proyecto (por ejemplo, *Documentos*):
   `powershell
   cd C:\Users\TuUsuario\Documents
   `
3. Clona este repositorio ejecutando:
   `ash
   git clone git@github.com:gongor7/tiktok-donation-counter-.git
   `
4. Entra a la carpeta del proyecto descargado:
   `ash
   cd tiktok-donation-counter-
   `

---

### 🔹 PASO 3: Instalar Dependencias y Encender el Servidor

1. Dentro de la carpeta del proyecto en tu terminal, instala los paquetes requeridos corriendo:
   `ash
   npm install
   `
2. Una vez finalizada la instalación de dependencias, enciende el servidor:
   `ash
   node server.js
   `
3. Verás una pantalla de confirmación diciendo:
   `	ext
   🚀 Servidor iniciado en http://localhost:3000
   `

*(💡 NOTA: Manten abierta esta ventana de terminal mientras estés en directo, ya que es el servidor que procesa las donaciones).*

---

### 🔹 PASO 4: Abrir el Panel de Control (Dashboard)

1. Abre tu navegador web (Chrome, Edge, Brave, etc.).
2. Entra al siguiente enlace: **[http://localhost:3000](http://localhost:3000)**
3. Aquí verás:
   - **Conexión a TikTok**: Ingresa tu @usuario de TikTok y haz clic en **Conectar** (requiere que estés transmitiendo EN VIVO).
   - **Configuración de Meta**: Cambia la meta de monedas a lograr.
   - **Simulador de Regalos**: Haz clic en los botones (Rosa, Corazón, León) para probar que todo funcione sin estar en vivo.

---

### 🔹 PASO 5: Agregar el Contador en OBS Studio o TikTok LIVE Studio

#### En OBS Studio:
1. Abre **OBS Studio**.
2. En el panel **Fuentes** (Sources), haz clic en el botón + y selecciona **Navegador** (*Browser Source*).
3. Nómbralo Contador TikTok.
4. En el campo **URL**, coloca:
   `	ext
   http://localhost:3000/overlay.html
   `
5. Ajusta el tamaño: **Ancho**: 800, **Alto**: 200.
6. Presiona **Aceptar**. La barra de donaciones transparente aparecerá en tu escena.

#### En TikTok LIVE Studio:
1. En la columna de Fuentes a la izquierda, haz clic en **Añadir fuente**.
2. Selecciona **Enlace Web**.
3. Pega http://localhost:3000/overlay.html y ajusta el tamaño en pantalla.

---

## 🛠️ Tecnologías Utilizadas
- **Node.js & Express**: Servidor HTTP backend
- **Socket.io**: Comunicación bidireccional en tiempo real con WebSockets
- **tiktok-live-connector**: Conexión directa a transmisiones en vivo de TikTok
- **CSS3 Glassmorphism**: Diseño oscuro estilo streamer con animaciones fluidas
