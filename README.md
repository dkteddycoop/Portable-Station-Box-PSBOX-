PSBOX es un lanzador de juegos para Windows que emula la interfaz y experiencia de usuario de PlayStation 4. Diseñado específicamente para sistemas HTPC (Home Theater PC) y configuraciones de juego en sala de estar, PSBOX transforma cualquier PC con Windows en una consola estilo PlayStation, ofreciendo navegación completa mediante mando y gestión avanzada de controles.

Propósito
Centralización de juegos: Organice todos sus juegos de Windows en una interfaz unificada tipo consola.

Experiencia de salón: Interfaz optimizada para uso con mando desde el sofá, sin necesidad de teclado o ratón.

Gestión profesional de mandos: Sistema avanzado para detección y administración de múltiples mandos XInput.

Funcionalidades Principales
Gestión de Juegos
Añadir juegos con nombre personalizado, ruta de ejecutable e imágenes personalizadas.

Editar juegos existentes (nombre, ruta, imágenes).

Eliminar juegos de la biblioteca.

Carrusel visual 3D estilo PS4 para navegación de biblioteca.

Sistema de Mandos XInput
Detección automática de hasta 4 mandos XInput simultáneos.

Interfaz visual de gestión de slots (SLOT 1-4).

Identificación automática del tipo de mando.

Detección de mandos duplicados que puedan causar conflictos.

Detección de Conflictos
Sistema anti-ghost para detectar mandos que duplican entradas.

Monitor de conflictos en tiempo real.

Resolución automática de mandos problemáticos.

Historial completo de conflictos detectados y resueltos.

Laboratorio de Pruebas de Mando
Visualización 3D en tiempo real incluyendo:

Posición de sticks analógicos.

Nivel de presión de gatillos.

Estado de todos los botones.

Pruebas específicas:

Latencia y tiempo de respuesta.

Análisis de zonas muertas.

Sensibilidad de gatillos.

Detección de entradas fantasma.

Test de motores de vibración.

Interfaz de Usuario
Fondo animado con gradientes dinámicos.

Carrusel 3D con efectos de profundidad.

Menú rápido de acceso a funciones.

Sistema de notificaciones.

Pantallas de carga personalizables por juego.

Navegación completa mediante mando.

Requisitos del Sistema
Sistema Operativo: Windows 10/11 (64-bit)

Arquitectura: x64

Memoria RAM: 4 GB mínimo, 8 GB recomendado

Gráficos: Compatibilidad con DirectX 11

Mandos: Cualquier mando compatible XInput

Instalación y Compilación
Prerrequisitos
Node.js (versión 18 o superior)

Descargar desde: https://nodejs.org/

Durante la instalación, marcar "Add to PATH"

PowerShell (incluido en Windows 10/11)

Ejecutar como Administrador

Proceso de Compilación
Abra PowerShell como Administrador y ejecute:

powershell
# Verificar instalación de Node.js
node --version
npm --version

# Crear directorio del proyecto
cd C:\
mkdir PSBOX
cd PSBOX

# Obtener código fuente
# Opción A: Con Git
git clone https://github.com/TU_USUARIO/psbox.git .

# Opción B: Descarga manual del ZIP desde GitHub

# Instalar dependencias
npm install

# Compilar para Windows
npm run build -- --win --x64
Archivos Generados
Tras la compilación, en la carpeta /dist encontrará:

PSBOX-Setup-1.0.0.exe - Instalador

/win-unpacked/PSBOX.exe - Versión portable

Guía de Uso
Navegación con Mando
Control	Función
D-Pad Izquierda/Derecha	Navegar entre juegos
D-Pad Arriba/Abajo	Saltar entre filas
Botón A (Xbox: A, PS: ✕)	Seleccionar/Iniciar juego
Botón B (Xbox: B, PS: ○)	Retroceder/Cerrar menú
Botón Start (☰)	Abrir menú rápido
Botón Select	Abrir gestor de mandos
Gestión de Juegos
Añadir Nuevo Juego
Navegar al elemento "Agregar Juego" (primer elemento del carrusel).

Pulsar A para abrir el formulario.

Completar los campos requeridos:

Nombre del juego

Ruta del ejecutable

Portada (opcional)

Imagen de carga (opcional)

Confirmar con "Guardar Juego".

Editar Juego Existente
Seleccionar el juego en el carrusel.

Abrir menú rápido (Start).

Seleccionar "Editar Juego".

Modificar los campos deseados.

Guardar cambios.

Eliminar Juego
Seleccionar el juego en el carrusel.

Abrir menú rápido (Start).

Seleccionar "Eliminar Juego".

Confirmar la operación.
