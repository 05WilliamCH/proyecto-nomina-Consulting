# Sistema de Nómina — Consulting, S.A.
### Fase 3: Desarrollo (stack PERN)

Proyecto final — Análisis de Sistemas II. Continuación de la Fase 1 (Análisis)
y la Fase 2 (Diseño / DERCAS) entregadas previamente: aquí se implementa el
código funcional en PostgreSQL + Express/Node.js + React (Vite).

## Contenido

```
proyecto-nomina/
  backend/            API REST en Node.js + Express + PostgreSQL (ver backend/README.md)
  frontend/           Aplicación web en React + Vite
  docker-compose.yml  Levanta PostgreSQL 17 con el schema y los datos ya cargados
```

## Puesta en marcha rápida

**1. Base de datos (PostgreSQL 17 vía Docker — recomendado)**
```bash
docker compose up -d        # crea las tablas y carga datos de ejemplo automáticamente
```
Si prefiere una instalación nativa de PostgreSQL 17 en su equipo en vez de
Docker, vea las instrucciones en `backend/README.md`.

**2. Backend**
```bash
cd backend
cp .env.example .env        # los valores por defecto ya coinciden con docker-compose.yml
npm install
npm run db:init             # idempotente: si usó Docker, solo agrega los usuarios de login
npm run dev                 # API en http://localhost:4000
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env        # por defecto ya apunta a http://localhost:4000/api
npm install
npm run dev                 # app en http://localhost:5173
```

Con ambos corriendo, abra `http://localhost:5173` en el navegador.

## Usuarios de acceso (creados por `npm run db:init`)

| Usuario | Contraseña | Rol |
|---|---|---|
| `rrhh` | `Rrhh#2026` | RRHH |
| `contabilidad` | `Conta#2026` | Contabilidad |
| `admin` | `Admin#2026` | Administrador |

**Cambie estas contraseñas antes de usar el sistema fuera de un entorno de
pruebas.** Puede crear más usuarios desde `/api/usuarios` (solo el rol
Administrador puede hacerlo).

## Seguridad

- **Autenticación:** login con usuario/contraseña, contraseñas guardadas con
  `bcrypt` (nunca en texto plano), sesión con JWT (`Authorization: Bearer <token>`).
- **Protección de rutas:** toda la API bajo `/api` exige un JWT válido
  (`requiereLogin`), excepto `/api/health` y `/api/auth/login`. Las
  operaciones de escritura además exigen un rol específico (`permitirRoles`):
  ver la tabla de permisos en `backend/README.md`.
- **Inyección SQL:** el backend nunca concatena datos del usuario dentro de
  una consulta SQL. Todas las consultas usan parámetros posicionales
  (`$1, $2, ...`) de la librería `pg`, que los envía separados del texto SQL
  al servidor — un valor como `' OR '1'='1` llega como dato literal, no como
  código SQL. Además hay una capa de validación de tipos
  (`src/utils/validacion.js`) que rechaza con 400 cualquier dato con forma
  inesperada antes de que llegue a la base de datos.

## Qué quedó probado en esta fase

El backend fue probado de punta a punta en un entorno con PostgreSQL real:
alta de empleados, registro de ingresos y egresos, cálculo del anticipo
quincenal (RF-04) y de la nómina de fin de mes (RF-05/RF-07) — estos dos
últimos ejecutados como **procedimientos almacenados reales de PostgreSQL**
(`sp_calcular_anticipo`, `sp_calcular_nomina_fin_de_mes`), con el nombre del
mes resuelto por una **función** de base de datos (`fn_nombre_mes`) tal como
lo pedía el enunciado — y los cinco reportes (RF-08 a RF-12), todos con
**joins** entre varias tablas. También se verificó que dos **triggers** de
auditoría insertan automáticamente en la tabla `auditoria` cada vez que se
calcula un anticipo o una nómina, sin que el código de Node.js lo haga
explícitamente. Además se probó el login y la protección de rutas: acceso
sin token (401), credenciales incorrectas (401), un rol sin permiso
intentando una acción de otro rol (403), y dos intentos reales de inyección
SQL (uno como nombre de empleado con `'; DROP TABLE empleado;--`, otro en
un parámetro de reporte) — en ambos casos el dato quedó tratado como texto
inofensivo y no alteró la base de datos. El frontend fue compilado
(`npm run build`) sin errores; incluye pantalla de login, sesión persistida
en el navegador, y las pantallas de Empleados, Ingresos/Egresos, Anticipos,
Nómina, Reportes y Parámetros, cada una visible solo para los roles que
corresponden.

*Nota: esa prueba se corrió contra PostgreSQL 16 porque es la versión que trae
el entorno donde se construyó este proyecto. El schema no usa ninguna
característica exclusiva de una versión, así que debería comportarse igual
en PostgreSQL 17; aun así, pruébelo en su máquina antes de darlo por
definitivo.*

## Ampliación del modelo de datos (22 tablas)

A partir de las 13 tablas de la primera versión de esta fase, se agregaron
9 más para cubrir funcionalidad real (no solo para "verse más robusto"):
roles y permisos formales (`rol`, `permiso`, `rol_permiso`), historial de
puesto/salario (`puesto`, `historial_laboral`), la tienda de la Asociación
Solidarista (`articulo_tienda`, `compra_tienda`, `detalle_compra_tienda`) y
recuperación de contraseña (`password_reset_token`). Los detalles de cada
una, y los triggers que las conectan entre sí, están documentados en
`backend/README.md`. Todo esto se probó de punta a punta contra PostgreSQL
real: actualizar el salario de un empleado generó solo una entrada en el
historial; registrar una compra en la tienda generó solo el egreso
correspondiente y ese monto se reflejó en el cálculo de nómina; y el flujo
completo de recuperación de contraseña (solicitar → token → restablecer →
la contraseña vieja deja de servir → el token no se puede reusar) funcionó
exactamente como se esperaba.

## Qué falta para producción (fuera de alcance de esta fase)

- Envío real de correo para la recuperación de contraseña (hoy el enlace
  se devuelve directamente en la respuesta, marcado como modo desarrollo,
  porque no hay servidor SMTP configurado en este proyecto académico).
- Expiración/renovación de sesión más allá de las 8 horas del JWT.
- Validaciones más finas en los formularios del frontend (hoy validan lo
  esencial vía atributos HTML como `required`).
- Despliegue en la nube (Fase 5), según la arquitectura definida en el DERCAS.
- Pruebas automatizadas (unitarias/integración), a desarrollar en la Fase 4.
