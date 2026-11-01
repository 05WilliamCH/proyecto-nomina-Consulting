# Backend - Sistema de Nomina, Consulting S.A. (Fase 3)

API REST en Node.js + Express + PostgreSQL que implementa la logica de
negocio definida en las Fases 1 y 2 (DERCAS) del proyecto.

## Requisitos
- Node.js 18+
- PostgreSQL 17 (probado también contra PostgreSQL 16; el schema no usa
  ninguna caracteristica especifica de una version en particular)

## Opcion A: PostgreSQL 17 con Docker (recomendado)

Desde la raiz del proyecto (`proyecto-nomina/`), no desde `backend/`:

```bash
docker compose up -d
```

Esto levanta PostgreSQL 17 oficial y crea las tablas y los datos de ejemplo
automaticamente la primera vez (usa `backend/src/db/schema.sql` y
`backend/src/db/seed.sql`). Luego, en `backend/`:

```bash
cp .env.example .env      # los valores por defecto ya coinciden con docker-compose.yml
npm install
npm run dev                # no ejecutar "npm run db:init": Docker ya inicializo la base
```

## Opcion B: PostgreSQL 17 instalado en su equipo

Ubuntu/Debian no traen PostgreSQL 17 en sus repositorios por defecto; hay
que agregar el repositorio oficial de PGDG:
<https://www.postgresql.org/download/linux/ubuntu/>. En Windows/Mac, use el
instalador oficial: <https://www.postgresql.org/download/>.

```bash
cp .env.example .env      # ajustar credenciales de PostgreSQL
npm install
npm run db:init           # crea las tablas y carga datos de ejemplo
npm run dev                # o: npm start
```

El servidor queda disponible en `http://localhost:4000`.

## Estructura

```
src/
  config/db.js          Conexion (pool) a PostgreSQL
  db/schema.sql          DDL de todas las tablas (ver DER en el DERCAS)
  db/seed.sql             Datos de ejemplo (departamentos, tipos, parametros, empleados)
  db/init.js              Script que aplica schema.sql + seed.sql
  services/nominaService.js    Nombre del mes, calculo de anticipo, calculo de nomina
  services/reporteService.js   Los 5 reportes exigidos por el enunciado
  routes/                 Un archivo de rutas por recurso
  utils/genericCrud.js    CRUD generico para catalogos simples
  app.js / server.js      Configuracion y arranque de Express
```

## Endpoints principales

| Metodo | Ruta                                   | Descripcion |
|--------|-----------------------------------------|-------------|
| GET    | /api/empleados                          | Listar empleados (RF-01) |
| POST   | /api/empleados                          | Crear empleado |
| PUT    | /api/empleados/:id                      | Actualizar empleado |
| DELETE | /api/empleados/:id                      | Inactivar empleado |
| GET/POST | /api/ingresos                         | Consultar / registrar ingresos (RF-02) |
| GET/POST | /api/egresos                          | Consultar / registrar egresos (RF-03) |
| POST   | /api/anticipos/calcular  { anio, mes }  | Calcular anticipo del 15 (RF-04) |
| POST   | /api/nomina/calcular  { anio, mes }     | Calcular nomina de fin de mes (RF-05/07) |
| GET    | /api/reportes/cumpleaneros?mes=9        | Reporte de cumpleaneros (RF-08) |
| GET    | /api/reportes/igss?anio=2026&mes=9      | Descuentos de IGSS (RF-09) |
| GET    | /api/reportes/isr?anio=2026&mes=9       | Descuentos de ISR (RF-10) |
| GET    | /api/reportes/poliza-contable?anio=..&mes=.. | Poliza contable (RF-11) |
| GET    | /api/reportes/libro-salarios?anio=..&mes=..  | Libro de salarios (RF-12) |
| GET/POST/PUT/DELETE | /api/departamentos, /api/cuentas-contables, /api/tipos-ingreso, /api/tipos-egreso, /api/puestos, /api/parametros | Catalogos (RF-13/RF-14) |
| GET/POST/PUT | /api/tienda/articulos | Catálogo de artículos de la tienda solidarista |
| GET/POST/DELETE | /api/tienda/compras | Registrar/consultar compras (sincroniza el egreso solo) |
| GET | /api/historial-laboral?id_empleado=.. | Historial de cambios de puesto/salario (solo lectura) |

## Notas de alcance (Fase 3)

- Los parametros legales (IGSS, ISR, bonificacion) se leen de la tabla
  `parametro_legal` y no estan escritos en el codigo, tal como lo exige RF-13.

## Funcion, procedimientos almacenados, triggers y joins

El enunciado del proyecto pide explícitamente una función que devuelva el
nombre del mes y un procedimiento que calcule la nómina de fin de mes.
Ambos viven como objetos reales de PostgreSQL en `src/db/schema.sql` (no
solo como código Node.js), y el backend los invoca directamente:

| Objeto | Tipo | Dónde se usa desde el backend |
|---|---|---|
| `fn_nombre_mes(mes)` | Función | `nominaService.obtenerNombreMes()` — `SELECT fn_nombre_mes($1)` |
| `fn_obtener_o_crear_periodo(anio, mes, tipo)` | Función | La usan los dos procedimientos de abajo y `nominaService.obtenerOCrearPeriodo()` |
| `sp_calcular_anticipo(anio, mes)` | Procedimiento | `POST /api/anticipos/calcular` — `CALL sp_calcular_anticipo($1,$2)` |
| `sp_calcular_nomina_fin_de_mes(anio, mes)` | Procedimiento | `POST /api/nomina/calcular` — `CALL sp_calcular_nomina_fin_de_mes($1,$2)` |
| `trg_auditar_anticipo` (sobre `anticipo`) | Trigger | Se dispara solo al insertar/actualizar un anticipo |
| `trg_auditar_nomina` (sobre `nomina_resultado`) | Trigger | Se dispara solo al insertar/actualizar un resultado de nómina |
| `trg_historial_laboral` (sobre `empleado`) | Trigger | Se dispara solo si cambia `salario_base` o `id_puesto` al actualizar un empleado |
| `trg_sync_egreso_tienda` (sobre `detalle_compra_tienda`) | Trigger | Recalcula el egreso "Descuento Tienda Solidarista" cada vez que cambia una compra |

Los dos triggers escriben en la tabla `auditoria` (quién calculó qué y
cuándo, sin que el backend tenga que acordarse de hacerlo), lo que reforma
directamente RNF-07 (trazabilidad). Esto se probó de punta a punta: al
calcular un anticipo y una nómina, `SELECT * FROM auditoria` mostró
automáticamente una fila por cada empleado, sin ningún `INSERT` explícito
del lado de Node.js.

**Joins:** ya estaban presentes desde el inicio de la Fase 3 en prácticamente
todas las consultas de lectura — `empleados` con `departamento`,
`ingresos/egresos` con `tipo_ingreso/tipo_egreso` y `periodo_nomina`, y los
5 reportes (especialmente la póliza contable, que hace `JOIN` entre
`nomina_resultado`, `empleado`, `departamento` y `cuenta_contable` para
agrupar el gasto por cuenta).

## Tienda de la Asociación Solidarista

`articulo_tienda`, `compra_tienda` y `detalle_compra_tienda` reemplazan lo
que antes era un monto manual para el egreso "Descuento Tienda
Solidarista": ahora se registran compras reales (empleado, período,
artículos y cantidades), y el trigger `trg_sync_egreso_tienda` suma el
total del período y lo refleja automáticamente en
`detalle_egreso_nomina` — sin que nadie tenga que capturarlo dos veces.
Se probó de punta a punta: una compra de Q590 generó sola el egreso
correspondiente, y ese monto apareció descontado en el cálculo de nómina
del período.

## Historial laboral

`puesto` (catálogo de cargos) y `historial_laboral` registran cada cambio
de puesto o salario de un empleado. No hay endpoint para escribir en
`historial_laboral`: se llena solo mediante el trigger
`trg_historial_laboral`, que compara los valores viejos y nuevos en cada
`UPDATE` sobre `empleado`. Se consulta con `GET /api/historial-laboral?id_empleado=..`.

## Roles y permisos formales (RBAC)

`usuario.rol` (un simple `VARCHAR`) se reemplazó por `usuario.id_rol`,
que referencia la tabla `rol`; `permiso` y `rol_permiso` (tabla intermedia
N:M) definen qué puede hacer cada rol. Al iniciar sesión, el JWT incluye
tanto el nombre del rol (`rol`, para no romper las rutas existentes que
usan `permitirRoles`) como el arreglo completo de códigos de permiso
(`permisos`), que las rutas nuevas (`/api/tienda/*`, `/api/historial-laboral`)
verifican con el middleware `permitirPermiso(...)`. Ambos mecanismos
conviven a propósito: las rutas más antiguas no se tocaron para no
arriesgar lo ya probado, y las nuevas usan el sistema más granular.

## Recuperación de contraseña

`password_reset_token` guarda un **hash** (nunca el token en texto plano)
con expiración de 30 minutos y una bandera `usado`. El flujo:

1. `POST /api/auth/olvide-password { nombre_usuario }` — genera el token
   y lo guarda hasheado. **No hay servidor de correo configurado** en este
   proyecto académico, así que la respuesta incluye el token directamente,
   marcada como `modoDesarrollo: true` (en producción bastaría con enviarlo
   por correo y no devolverlo en el JSON). La respuesta es idéntica exista
   o no el usuario, para no revelar qué cuentas existen.
2. `POST /api/auth/restablecer-password { token, password_nueva }` —
   valida que el token no haya expirado ni se haya usado, actualiza la
   contraseña (con `bcrypt`) y marca el token como usado.

Se probó el flujo completo: solicitud → token → restablecimiento → la
contraseña vieja deja de funcionar (401) → la nueva funciona (200) →
reutilizar el mismo token falla (400, "inválido o ya expiró"). Ambos
endpoints tienen su propio límite de intentos por IP (`express-rate-limit`).

## Autenticacion y permisos por rol

Todas las rutas bajo `/api` (excepto `/api/health` y `POST /api/auth/login`)
exigen un header `Authorization: Bearer <token>` obtenido al iniciar sesion.

| Recurso | Lectura (GET) | Escritura (POST/PUT/DELETE) |
|---|---|---|
| /api/empleados | cualquier rol autenticado | RRHH, Administrador |
| /api/ingresos, /api/egresos | cualquier rol autenticado | RRHH, Administrador |
| /api/anticipos, /api/nomina (consultar) | cualquier rol autenticado | — |
| /api/anticipos/calcular, /api/nomina/calcular | — | RRHH, Administrador |
| /api/reportes/* | cualquier rol autenticado | (son de solo lectura) |
| /api/departamentos, /api/cuentas-contables, /api/tipos-ingreso, /api/tipos-egreso, /api/parametros | cualquier rol autenticado | Administrador |
| /api/usuarios | Administrador | Administrador |

### Endpoints de autenticacion

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /api/auth/login | `{ nombre_usuario, password }` → `{ token, usuario }` |
| GET | /api/auth/me | Devuelve el usuario de la sesion actual (requiere token) |
| POST | /api/auth/olvide-password | `{ nombre_usuario }` → genera un token de recuperación |
| POST | /api/auth/restablecer-password | `{ token, password_nueva }` → cambia la contraseña |
| GET/POST | /api/usuarios | Listar / crear usuarios (solo Administrador) |
| PUT | /api/usuarios/:id/estado | Activar/inactivar un usuario (solo Administrador) |

### Usuarios por defecto

`npm run db:init` crea automáticamente estos tres usuarios (uno por rol):

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | Admin#2026 | Administrador |
| rrhh | Rrhh#2026 | RRHH |
| contabilidad | Conta#2026 | Contabilidad |

**Cámbielas (o cree las suyas y desactive estas) antes de usar el sistema
fuera de un entorno de pruebas.** Puede crear más usuarios autenticándose
como `admin` y llamando a `POST /api/usuarios`.

## Seguridad

**Inyección SQL.** Todas las consultas del proyecto usan parámetros
posicionales de la librería `pg` (`$1`, `$2`, ...) en vez de concatenar
texto para construir SQL — nunca algo como `` `WHERE id = ${req.body.id}` ``.
`pg` envía el texto SQL y los valores por separado al servidor, así que un
valor como `1; DROP TABLE empleado;--` llega como un dato de texto, nunca
como parte del comando. Esto se probó directamente contra PostgreSQL real:
se envió ese payload como nombre de empleado y como parámetro de un reporte,
y en ambos casos quedó guardado/tratado como texto inofensivo. Además,
`src/utils/validacion.js` valida la forma de los datos (enteros, montos,
años, meses) antes de que lleguen a una consulta, devolviendo un 400 claro
en vez de dejar pasar datos con forma inesperada.

**Autenticación.** Contraseñas con hash `bcrypt` (nunca en texto plano ni
comparadas directamente); sesiones con JWT firmado (`JWT_SECRET` en `.env`,
**cámbielo** antes de usar el sistema en serio); límite de intentos de
login por IP (`express-rate-limit`) para dificultar fuerza bruta; cabeceras
HTTP endurecidas con `helmet`.

**Manejo de errores.** El detalle completo de cualquier error se registra
en el log del servidor, pero al cliente solo se le devuelve el mensaje
crudo cuando `NODE_ENV` no es `production` — así un error de PostgreSQL no
filtra nombres de tablas o columnas en un entorno real.
