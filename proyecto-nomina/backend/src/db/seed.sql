-- ============================================================
-- Datos semilla - Sistema de Nomina, Consulting S.A.
-- ============================================================

-- ---------- Roles y permisos ----------
INSERT INTO rol (nombre) VALUES ('RRHH'), ('Contabilidad'), ('Administrador')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO permiso (codigo, descripcion) VALUES
  ('empleados.leer',            'Consultar empleados'),
  ('empleados.escribir',        'Crear, editar o inactivar empleados'),
  ('ingresos_egresos.leer',     'Consultar ingresos y egresos registrados'),
  ('ingresos_egresos.escribir', 'Registrar ingresos y egresos'),
  ('anticipos.calcular',        'Calcular el anticipo quincenal'),
  ('nomina.calcular',           'Calcular la nomina de fin de mes'),
  ('reportes.ver',              'Ver los reportes del sistema'),
  ('catalogos.escribir',        'Administrar departamentos, cuentas contables y tipos'),
  ('parametros.escribir',       'Editar parametros legales (IGSS, ISR, bonificacion)'),
  ('usuarios.gestionar',        'Crear/editar usuarios del sistema'),
  ('tienda.leer',               'Consultar articulos y compras de la tienda solidarista'),
  ('tienda.escribir',           'Administrar articulos y registrar compras en la tienda'),
  ('historial_laboral.ver',     'Consultar el historial de puesto/salario de un empleado')
ON CONFLICT (codigo) DO NOTHING;

-- RRHH: opera el dia a dia de nomina y la tienda solidarista.
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT (SELECT id_rol FROM rol WHERE nombre='RRHH'), id_permiso FROM permiso
WHERE codigo IN ('empleados.leer','empleados.escribir','ingresos_egresos.leer','ingresos_egresos.escribir',
                  'anticipos.calcular','nomina.calcular','reportes.ver','tienda.leer','tienda.escribir',
                  'historial_laboral.ver')
ON CONFLICT DO NOTHING;

-- Contabilidad: solo consulta reportes y la tienda (para conciliar descuentos).
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT (SELECT id_rol FROM rol WHERE nombre='Contabilidad'), id_permiso FROM permiso
WHERE codigo IN ('reportes.ver','tienda.leer')
ON CONFLICT DO NOTHING;

-- Administrador: todos los permisos.
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT (SELECT id_rol FROM rol WHERE nombre='Administrador'), id_permiso FROM permiso
ON CONFLICT DO NOTHING;

INSERT INTO cuenta_contable (codigo, nombre) VALUES
  ('5101', 'Gasto de Nomina - Finanzas'),
  ('5102', 'Gasto de Nomina - Produccion'),
  ('5103', 'Gasto de Nomina - Logistica'),
  ('5104', 'Gasto de Nomina - Recursos Humanos'),
  ('5105', 'Gasto de Nomina - Mercadeo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO departamento (nombre, id_cuenta_contable) VALUES
  ('Finanzas',          (SELECT id_cuenta_contable FROM cuenta_contable WHERE codigo='5101')),
  ('Produccion',        (SELECT id_cuenta_contable FROM cuenta_contable WHERE codigo='5102')),
  ('Logistica',         (SELECT id_cuenta_contable FROM cuenta_contable WHERE codigo='5103')),
  ('Recursos Humanos',  (SELECT id_cuenta_contable FROM cuenta_contable WHERE codigo='5104')),
  ('Mercadeo',          (SELECT id_cuenta_contable FROM cuenta_contable WHERE codigo='5105'))
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO puesto (nombre, descripcion) VALUES
  ('Analista',            'Analista de area'),
  ('Asistente',           'Asistente administrativo'),
  ('Encargado',           'Encargado de area'),
  ('Gerente',             'Gerente de departamento'),
  ('Ejecutivo de Ventas', 'Ejecutivo comercial')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipo_ingreso (nombre, afecto_igss) VALUES
  ('Salario Base', TRUE),
  ('Horas Extras y Dobles', TRUE),
  ('Bonificacion Decreto', FALSE),
  ('Bonificacion x Produccion', TRUE),
  ('Comisiones', TRUE)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipo_egreso (nombre) VALUES
  ('IGSS'),
  ('ISR'),
  ('Ahorro Asociacion Solidarista'),
  ('Descuento Tienda Solidarista')
ON CONFLICT (nombre) DO NOTHING;

-- Parametros legales vigentes (ver Fase 1 / DERCAS, seccion Reglas de Negocio).
-- Se modelan como parametros configurables porque la ley cambia (Decreto 13-2026).
INSERT INTO parametro_legal (nombre, valor) VALUES
  ('IGSS_PORCENTAJE_EMPLEADO', 4.83),
  ('ISR_TRAMO1_LIMITE', 300000),
  ('ISR_TRAMO1_PORCENTAJE', 5),
  ('ISR_TRAMO2_PORCENTAJE', 7),
  ('ISR_DEDUCCION_UNICA_ANUAL', 48000),
  ('BONO_DECRETO_MONTO', 250),
  ('ANTICIPO_PORCENTAJE', 50)
ON CONFLICT DO NOTHING;

-- Empleados de ejemplo, uno por departamento.
INSERT INTO empleado (nombres, apellidos, fecha_nacimiento, id_departamento, id_puesto, dpi, nit, salario_base, dias_laborados, estado, banco, tipo_cuenta_banco, numero_cuenta_banco)
SELECT * FROM (VALUES
  ('Ana',    'Lopez',   DATE '1992-09-10', (SELECT id_departamento FROM departamento WHERE nombre='Recursos Humanos'), (SELECT id_puesto FROM puesto WHERE nombre='Encargado'),          '1234567890101', '1234567-8', 4200.00, 30, 'Activo','Banco Industrial', 'Monetaria', '042-000001-01'),
  ('Carlos', 'Perez',   DATE '1988-03-22', (SELECT id_departamento FROM departamento WHERE nombre='Finanzas'),         (SELECT id_puesto FROM puesto WHERE nombre='Analista'),            '2345678901202', '2345678-9', 5100.00, 30, 'Activo','Banco Industrial', 'Monetaria', '041-000001-01'),
  ('Maria',  'Ruiz',    DATE '1995-09-05', (SELECT id_departamento FROM departamento WHERE nombre='Mercadeo'),         (SELECT id_puesto FROM puesto WHERE nombre='Ejecutivo de Ventas'), '3456789012303', '3456789-0', 3900.00, 30, 'Activo','Banco Industrial', 'Monetaria', '040-000001-01'),
  ('Jose',   'Garcia',  DATE '1990-11-30', (SELECT id_departamento FROM departamento WHERE nombre='Produccion'),       (SELECT id_puesto FROM puesto WHERE nombre='Gerente'),             '4567890123404', '4567890-1', 4600.00, 30, 'Activo','Banco Industrial', 'Ahorro', '043-000001-01'),
  ('Lucia',  'Mendez',  DATE '1993-06-18', (SELECT id_departamento FROM departamento WHERE nombre='Logistica'),        (SELECT id_puesto FROM puesto WHERE nombre='Asistente'),           '5678901234505', '5678901-2', 4300.00, 30, 'Activo','Banco Industrial', 'Ahorro', '044-000001-01')
) AS v(nombres, apellidos, fecha_nacimiento, id_departamento, id_puesto, dpi, nit, salario_base, dias_laborados, estado)
WHERE NOT EXISTS (SELECT 1 FROM empleado LIMIT 1);

-- Articulos de ejemplo para la tienda de la Asociacion Solidarista.
INSERT INTO articulo_tienda (nombre, precio, stock) VALUES
  ('Canasta basica',        350.00, 50),
  ('Utiles escolares',      120.00, 80),
  ('Electrodomestico menor', 450.00, 15),
  ('Vale de despensa',      200.00, 100)
ON CONFLICT (nombre) DO NOTHING;
