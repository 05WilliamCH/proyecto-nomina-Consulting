-- ============================================================
-- Esquema de base de datos - Sistema de Nomina, Consulting S.A.
-- Corresponde al Diagrama Entidad-Relacion del documento DERCAS,
-- ampliado en Fase 3 con: RBAC (rol/permiso), historial laboral,
-- tienda de la Asociacion Solidarista y recuperacion de contrasena.
-- ============================================================

CREATE TABLE IF NOT EXISTS cuenta_contable (
  id_cuenta_contable  SERIAL PRIMARY KEY,
  codigo              VARCHAR(20)  NOT NULL UNIQUE,
  nombre              VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS departamento (
  id_departamento     SERIAL PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL UNIQUE,
  id_cuenta_contable  INT REFERENCES cuenta_contable(id_cuenta_contable)
);

-- ---------- RBAC: roles y permisos formales ----------
CREATE TABLE IF NOT EXISTS rol (
  id_rol  SERIAL PRIMARY KEY,
  nombre  VARCHAR(20) NOT NULL UNIQUE CHECK (nombre IN ('RRHH','Contabilidad','Administrador'))
);

CREATE TABLE IF NOT EXISTS permiso (
  id_permiso   SERIAL PRIMARY KEY,
  codigo       VARCHAR(60) NOT NULL UNIQUE,
  descripcion  VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS rol_permiso (
  id_rol     INT NOT NULL REFERENCES rol(id_rol) ON DELETE CASCADE,
  id_permiso INT NOT NULL REFERENCES permiso(id_permiso) ON DELETE CASCADE,
  PRIMARY KEY (id_rol, id_permiso)
);

-- ---------- Puesto e historial laboral ----------
CREATE TABLE IF NOT EXISTS puesto (
  id_puesto    SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL UNIQUE,
  descripcion  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS empleado (
  id_empleado       SERIAL PRIMARY KEY,
  nombres           VARCHAR(100) NOT NULL,
  apellidos         VARCHAR(100) NOT NULL,
  fecha_nacimiento  DATE NOT NULL,
  fecha_ingreso     DATE NOT NULL DEFAULT CURRENT_DATE,
  id_departamento   INT NOT NULL REFERENCES departamento(id_departamento),
  id_puesto         INT REFERENCES puesto(id_puesto),
  -- Documento Personal de Identificación (13 dígitos, único por empleado)
  dpi               VARCHAR(13) UNIQUE,
  -- Número de Identificación Tributaria del empleado
  nit               VARCHAR(20),
  salario_base      NUMERIC(10,2) NOT NULL CHECK (salario_base >= 0),
  dias_laborados    INT NOT NULL DEFAULT 30,
  estado            VARCHAR(20) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','Inactivo'))
  --Banco
  banco               VARCHAR(100),
  tipo_cuenta_banco   VARCHAR(20) CHECK (tipo_cuenta_banco IN ('Monetaria','Ahorro') OR tipo_cuenta_banco IS NULL),
  numero_cuenta_banco VARCHAR(30) UNIQUE,
);

CREATE TABLE IF NOT EXISTS historial_laboral (
  id_historial        SERIAL PRIMARY KEY,
  id_empleado         INT NOT NULL REFERENCES empleado(id_empleado),
  id_puesto_anterior  INT REFERENCES puesto(id_puesto),
  id_puesto_nuevo     INT REFERENCES puesto(id_puesto),
  salario_anterior    NUMERIC(10,2),
  salario_nuevo       NUMERIC(10,2),
  fecha_cambio        TIMESTAMP NOT NULL DEFAULT now(),
  motivo              VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tipo_ingreso (
  id_tipo_ingreso  SERIAL PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL UNIQUE,
  afecto_igss      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tipo_egreso (
  id_tipo_egreso  SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS periodo_nomina (
  id_periodo     SERIAL PRIMARY KEY,
  anio           INT NOT NULL,
  mes            INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  tipo           VARCHAR(20) NOT NULL CHECK (tipo IN ('Anticipo','Fin de Mes')),
  fecha_calculo  TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (anio, mes, tipo)
);

CREATE TABLE IF NOT EXISTS detalle_ingreso_nomina (
  id_detalle       SERIAL PRIMARY KEY,
  id_empleado      INT NOT NULL REFERENCES empleado(id_empleado),
  id_tipo_ingreso  INT NOT NULL REFERENCES tipo_ingreso(id_tipo_ingreso),
  id_periodo       INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  monto            NUMERIC(10,2) NOT NULL CHECK (monto >= 0)
);

CREATE TABLE IF NOT EXISTS detalle_egreso_nomina (
  id_detalle      SERIAL PRIMARY KEY,
  id_empleado     INT NOT NULL REFERENCES empleado(id_empleado),
  id_tipo_egreso  INT NOT NULL REFERENCES tipo_egreso(id_tipo_egreso),
  id_periodo      INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  monto           NUMERIC(10,2) NOT NULL CHECK (monto >= 0)
);

CREATE TABLE IF NOT EXISTS anticipo (
  id_anticipo  SERIAL PRIMARY KEY,
  id_empleado  INT NOT NULL REFERENCES empleado(id_empleado),
  id_periodo   INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  monto        NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  UNIQUE (id_empleado, id_periodo)
);

CREATE TABLE IF NOT EXISTS parametro_legal (
  id_parametro    SERIAL PRIMARY KEY,
  nombre          VARCHAR(60) NOT NULL,
  valor           NUMERIC(12,4) NOT NULL,
  vigente_desde   DATE NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta   DATE
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario       SERIAL PRIMARY KEY,
  nombre_usuario   VARCHAR(50) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  id_rol           INT NOT NULL REFERENCES rol(id_rol),
  id_empleado      INT REFERENCES empleado(id_empleado),
  estado           VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  fecha_creacion   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_token (
  id_token          SERIAL PRIMARY KEY,
  id_usuario        INT NOT NULL REFERENCES usuario(id_usuario),
  token_hash        VARCHAR(255) NOT NULL,
  fecha_creacion    TIMESTAMP NOT NULL DEFAULT now(),
  fecha_expiracion  TIMESTAMP NOT NULL,
  usado             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS nomina_resultado (
  id_resultado         SERIAL PRIMARY KEY,
  id_empleado          INT NOT NULL REFERENCES empleado(id_empleado),
  id_periodo           INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  total_ingresos       NUMERIC(10,2) NOT NULL,
  total_egresos        NUMERIC(10,2) NOT NULL,
  anticipo_descontado  NUMERIC(10,2) NOT NULL DEFAULT 0,
  liquido_a_pagar      NUMERIC(10,2) NOT NULL,
  UNIQUE (id_empleado, id_periodo)
);

-- ---------- Tienda de la Asociacion Solidarista ----------
CREATE TABLE IF NOT EXISTS articulo_tienda (
  id_articulo  SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL UNIQUE,
  descripcion  VARCHAR(255),
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock        INT NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS compra_tienda (
  id_compra    SERIAL PRIMARY KEY,
  id_empleado  INT NOT NULL REFERENCES empleado(id_empleado),
  id_periodo   INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  fecha        TIMESTAMP NOT NULL DEFAULT now(),
  total        NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- id_empleado / id_periodo se repiten aqui (ademas de estar en
-- compra_tienda) a proposito: el trigger de sincronizacion con egresos
-- necesita esos datos incluso en un DELETE en cascada del encabezado.
CREATE TABLE IF NOT EXISTS detalle_compra_tienda (
  id_detalle_compra  SERIAL PRIMARY KEY,
  id_compra          INT NOT NULL REFERENCES compra_tienda(id_compra) ON DELETE CASCADE,
  id_empleado        INT NOT NULL REFERENCES empleado(id_empleado),
  id_periodo         INT NOT NULL REFERENCES periodo_nomina(id_periodo),
  id_articulo        INT NOT NULL REFERENCES articulo_tienda(id_articulo),
  cantidad           INT NOT NULL CHECK (cantidad > 0),
  precio_unitario    NUMERIC(10,2) NOT NULL,
  subtotal           NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria  SERIAL PRIMARY KEY,
  tabla         VARCHAR(50) NOT NULL,
  operacion     VARCHAR(10) NOT NULL,
  id_empleado   INT,
  id_periodo    INT,
  monto         NUMERIC(10,2),
  fecha_evento  TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================================
-- Funcion, procedimientos almacenados y triggers
-- ============================================================

CREATE OR REPLACE FUNCTION fn_nombre_mes(p_mes INT)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE p_mes
    WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
    WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
    WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
    WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_obtener_o_crear_periodo(p_anio INT, p_mes INT, p_tipo VARCHAR)
RETURNS INT AS $$
DECLARE
  v_id_periodo INT;
BEGIN
  SELECT id_periodo INTO v_id_periodo FROM periodo_nomina
    WHERE anio = p_anio AND mes = p_mes AND tipo = p_tipo;

  IF v_id_periodo IS NULL THEN
    INSERT INTO periodo_nomina (anio, mes, tipo) VALUES (p_anio, p_mes, p_tipo)
      RETURNING id_periodo INTO v_id_periodo;
  END IF;

  RETURN v_id_periodo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE sp_calcular_anticipo(p_anio INT, p_mes INT)
LANGUAGE plpgsql AS $$
DECLARE
  v_id_periodo  INT;
  v_porcentaje  NUMERIC;
  v_monto       NUMERIC;
  emp           RECORD;
BEGIN
  SELECT valor INTO v_porcentaje FROM parametro_legal
    WHERE nombre = 'ANTICIPO_PORCENTAJE'
      AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
    ORDER BY vigente_desde DESC LIMIT 1;

  IF v_porcentaje IS NULL THEN
    RAISE EXCEPTION 'Parametro legal no configurado: ANTICIPO_PORCENTAJE';
  END IF;

  v_id_periodo := fn_obtener_o_crear_periodo(p_anio, p_mes, 'Anticipo');

  FOR emp IN SELECT id_empleado, salario_base FROM empleado WHERE estado = 'Activo' LOOP
    v_monto := ROUND(emp.salario_base * (v_porcentaje / 100), 2);
    INSERT INTO anticipo (id_empleado, id_periodo, monto)
      VALUES (emp.id_empleado, v_id_periodo, v_monto)
      ON CONFLICT (id_empleado, id_periodo) DO UPDATE SET monto = EXCLUDED.monto;
  END LOOP;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_calcular_nomina_fin_de_mes(p_anio INT, p_mes INT)
LANGUAGE plpgsql AS $$
DECLARE
  v_id_periodo_fin        INT;
  v_id_periodo_anticipo   INT;
  v_ingresos              NUMERIC;
  v_egresos               NUMERIC;
  v_anticipo              NUMERIC;
  v_liquido               NUMERIC;
  emp                     RECORD;
BEGIN
  v_id_periodo_fin := fn_obtener_o_crear_periodo(p_anio, p_mes, 'Fin de Mes');

  SELECT id_periodo INTO v_id_periodo_anticipo FROM periodo_nomina
    WHERE anio = p_anio AND mes = p_mes AND tipo = 'Anticipo';

  FOR emp IN SELECT id_empleado FROM empleado WHERE estado = 'Activo' LOOP
    SELECT COALESCE(SUM(monto), 0) INTO v_ingresos FROM detalle_ingreso_nomina
      WHERE id_empleado = emp.id_empleado AND id_periodo = v_id_periodo_fin;

    SELECT COALESCE(SUM(monto), 0) INTO v_egresos FROM detalle_egreso_nomina
      WHERE id_empleado = emp.id_empleado AND id_periodo = v_id_periodo_fin;

    v_anticipo := 0;
    IF v_id_periodo_anticipo IS NOT NULL THEN
      SELECT COALESCE(monto, 0) INTO v_anticipo FROM anticipo
        WHERE id_empleado = emp.id_empleado AND id_periodo = v_id_periodo_anticipo;
    END IF;

    v_liquido := v_ingresos - v_egresos - COALESCE(v_anticipo, 0);

    INSERT INTO nomina_resultado
        (id_empleado, id_periodo, total_ingresos, total_egresos, anticipo_descontado, liquido_a_pagar)
      VALUES (emp.id_empleado, v_id_periodo_fin, v_ingresos, v_egresos, COALESCE(v_anticipo, 0), v_liquido)
      ON CONFLICT (id_empleado, id_periodo) DO UPDATE SET
        total_ingresos = EXCLUDED.total_ingresos,
        total_egresos = EXCLUDED.total_egresos,
        anticipo_descontado = EXCLUDED.anticipo_descontado,
        liquido_a_pagar = EXCLUDED.liquido_a_pagar;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar_anticipo() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (tabla, operacion, id_empleado, id_periodo, monto)
    VALUES ('anticipo', TG_OP, NEW.id_empleado, NEW.id_periodo, NEW.monto);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditar_anticipo ON anticipo;
CREATE TRIGGER trg_auditar_anticipo
  AFTER INSERT OR UPDATE ON anticipo
  FOR EACH ROW EXECUTE FUNCTION fn_auditar_anticipo();

CREATE OR REPLACE FUNCTION fn_auditar_nomina() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (tabla, operacion, id_empleado, id_periodo, monto)
    VALUES ('nomina_resultado', TG_OP, NEW.id_empleado, NEW.id_periodo, NEW.liquido_a_pagar);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditar_nomina ON nomina_resultado;
CREATE TRIGGER trg_auditar_nomina
  AFTER INSERT OR UPDATE ON nomina_resultado
  FOR EACH ROW EXECUTE FUNCTION fn_auditar_nomina();

CREATE OR REPLACE FUNCTION fn_historial_laboral() RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.salario_base IS DISTINCT FROM NEW.salario_base)
     OR (OLD.id_puesto IS DISTINCT FROM NEW.id_puesto) THEN
    INSERT INTO historial_laboral
        (id_empleado, id_puesto_anterior, id_puesto_nuevo, salario_anterior, salario_nuevo, motivo)
      VALUES (NEW.id_empleado, OLD.id_puesto, NEW.id_puesto, OLD.salario_base, NEW.salario_base,
              'Actualizacion de datos del empleado');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_laboral ON empleado;
CREATE TRIGGER trg_historial_laboral
  AFTER UPDATE ON empleado
  FOR EACH ROW EXECUTE FUNCTION fn_historial_laboral();

CREATE OR REPLACE FUNCTION fn_sync_egreso_tienda() RETURNS TRIGGER AS $$
DECLARE
  v_id_empleado    INT := COALESCE(NEW.id_empleado, OLD.id_empleado);
  v_id_periodo     INT := COALESCE(NEW.id_periodo, OLD.id_periodo);
  v_id_compra      INT := COALESCE(NEW.id_compra, OLD.id_compra);
  v_id_tipo        INT;
  v_total_compra   NUMERIC;
  v_total_periodo  NUMERIC;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_total_compra
    FROM detalle_compra_tienda WHERE id_compra = v_id_compra;
  UPDATE compra_tienda SET total = v_total_compra WHERE id_compra = v_id_compra;

  SELECT id_tipo_egreso INTO v_id_tipo FROM tipo_egreso
    WHERE nombre = 'Descuento Tienda Solidarista';

  SELECT COALESCE(SUM(total), 0) INTO v_total_periodo
    FROM compra_tienda WHERE id_empleado = v_id_empleado AND id_periodo = v_id_periodo;

  DELETE FROM detalle_egreso_nomina
    WHERE id_empleado = v_id_empleado AND id_periodo = v_id_periodo AND id_tipo_egreso = v_id_tipo;

  IF v_total_periodo > 0 THEN
    INSERT INTO detalle_egreso_nomina (id_empleado, id_tipo_egreso, id_periodo, monto)
      VALUES (v_id_empleado, v_id_tipo, v_id_periodo, v_total_periodo);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_egreso_tienda ON detalle_compra_tienda;
CREATE TRIGGER trg_sync_egreso_tienda
  AFTER INSERT OR UPDATE OR DELETE ON detalle_compra_tienda
  FOR EACH ROW EXECUTE FUNCTION fn_sync_egreso_tienda();
