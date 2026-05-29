# ShieldMind AI Frontend - Aseguradora del Sur 🛡️🧠

¡Bienvenido al frontend de **ShieldMind AI**, la interfaz de usuario de nivel producción y alta fidelidad visual diseñada para la **Aseguradora del Sur**! Este portal, construido con **Next.js**, **TypeScript** y **Tailwind CSS**, sirve como la central operativa de triaje y auditoría para que los analistas de seguros evalúen siniestros, consulten análisis predictivos de fraude, identifiquen similitudes semánticas e interactúen con un Copiloto de Inteligencia Artificial (RAG).

---

## 🎨 Principios de Diseño y Estética Premium

La interfaz ha sido desarrollada con un estándar visual premium orientado al usuario corporativo, incorporando:
*   **Identidad de Marca:** Uso estricto de la paleta institucional (Azul Navy `#081f3f`, Celeste `#00adef`, Slate, Blanco) complementada con colores de estado curados (escala semafórica HSL para banderas de riesgo Verde, Amarillo y Rojo).
*   **Micro-animaciones:** Efectos de transición suaves en el sidebar, hover states reactivos en todas las tarjetas de datos, y widgets colapsables para optimizar el espacio de trabajo.
*   **Glassmorphism:** Sidebar y headers con efectos de desenfoque translúcido (`backdrop-filter`) que transmiten una estética moderna y limpia.

---

## 📂 Arquitectura de Vistas Principales

La aplicación se compone de tres vistas clave estructuradas bajo el **Pages Router** de Next.js:

### 1. Bandeja de Triaje y Analítica de Siniestros (`/`)
La pantalla de inicio del analista. Presenta un centro de comando unificado:
*   **Gráficos Interactivos (Recharts):** Visualización dinámica de la distribución de siniestros por banda de riesgo y volumen mensual de reportes.
*   **Tabla de Triaje Avanzada:** Listado paginado de siniestros con filtros rápidos por estado, nivel de riesgo y barra de búsqueda predictiva en tiempo real.
*   **Botón de Sincronización:** Conexión directa con el backend para disparar el escaneo en vivo de la bandeja de entrada de Gmail y refrescar el tablero instantáneamente.

### 2. Expediente 360° y Detalle de Caso (`/caso/[id]`)
Una experiencia de pantalla dividida (**Split Screen**) de alta densidad informativa para la auditoría exhaustiva:
*   **Panel de Datos Duros (Izquierda):** Información estructurada del asegurado, póliza, ramo, sucursal, fechas clave y montos financieros.
*   **Widget de Similitud Semántica (NLP):** Listado interactivo que muestra casos anteriores que comparten patrones lingüísticos y descripciones narrativas similares, alertando sobre colisiones duplicadas o fraudes seriales.
*   **Auditoría de IA y Reglas (Centro):** Visualización del desglose del scoring de riesgo, semáforo de peligro y las justificaciones del modelo de OpenAI.
*   **Copiloto AI Integrado (Derecha - Colapsable):** Chat interactivo que consume el motor RAG del backend, permitiendo al analista formular preguntas como: *"¿Existe algún indicio de falsificación de documentos en este caso?"* o *"Resume la narrativa de hechos en dos viñetas"*.

### 3. Formulario Público de Declaración (`/reportar`)
El portal de autoservicio que se expone a los asegurados y beneficiarios:
*   **Mapeo de 20 Campos:** Diseñado para recolectar el modelo de datos exacto de la base de datos PostgreSQL del backend.
*   **Campos Bloqueados / Autogenerados:** Campos de control del sistema como el ID de siniestro (`SHM-XXXX`), Fecha de Reporte (hoy), Estado (`Pendiente`) y Monto Pagado (`$0.00`) están bloqueados para evitar alteraciones manuales y garantizar la integridad del flujo.
*   **Cálculo Dinámico:** Incorpora lógica reactiva (`useEffect`) que calcula los días exactos transcurridos entre la ocurrencia del siniestro y la fecha de reporte.
*   **Checklist Interactivo:** Carga y marca de documentos adjuntos de soporte.

---

## 🛠️ Instalación y Configuración Local

Sigue estos pasos en tu terminal para levantar el servidor de desarrollo en tu máquina local:

### 1. Acceder al Directorio e Instalar Dependencias
```bash
# Acceder a la carpeta del frontend
cd C:\Users\jused\OneDrive\Escritorio\Aseguradora\frontend

# Instalar los paquetes definidos en package.json (Next.js, Tailwind, Axios, Recharts)
npm install
```

### 2. Configurar Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz de `frontend/` indicando la ruta del backend:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Levantar el Servidor de Desarrollo
```bash
# Iniciar Next.js en el puerto local por defecto (3000)
npm run dev
```
Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador web.

### 4. Pruebas de Producción (Compilación)
Para verificar la ausencia de advertencias TypeScript y validar la velocidad de carga de producción, puedes compilar la app:
```bash
# Compilar la aplicación a producción
npm run build

# Iniciar el servidor optimizado compilado
npm run start
```

---

## 🔗 Capa de Integración con el Backend (`Axios`)

La comunicación con el API de FastAPI se centraliza bajo una arquitectura limpia de servicios:
*   **`src/services/api.ts`:** Instancia base de Axios configurada con el `NEXT_PUBLIC_API_URL`, soporte para CORS y tipos TypeScript 100% seguros (libre de errores de asignación de headers en Next.js compilation).
*   **`src/services/claims.ts` (Servicio de Siniestros y Chat):** Define las llamadas tipadas para listar, auditar, sincronizar correos y realizar consultas conversacionales con el chatbot RAG.

---

## 🚀 Puntos de Control y Buenas Prácticas
*   **Tipado Estricto:** Todos los componentes utilizan TypeScript estricto. Al realizar cambios en las interfaces de datos de Siniestros, asegúrate de actualizar los modelos en `src/types/` (o el esquema en `claims.ts`) para no romper el build de producción.
*   **Tailwind CSS:** Evita estilos inline. Utiliza las clases utilitarias integradas en Tailwind para mantener la consistencia estética y la adaptabilidad responsive en pantallas de tablets y smartphones.
