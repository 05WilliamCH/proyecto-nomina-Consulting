const express = require("express");

const router = express.Router();

router.use("/empleados", require("./empleados"));
router.use("/departamentos", require("./departamentos"));
router.use("/cuentas-contables", require("./cuentasContables"));
router.use("/tipos-ingreso", require("./tiposIngreso"));
router.use("/tipos-egreso", require("./tiposEgreso"));
router.use("/puestos", require("./puestos"));
router.use("/ingresos", require("./ingresos"));
router.use("/egresos", require("./egresos"));
router.use("/anticipos", require("./anticipos"));
router.use("/nomina", require("./nomina"));
router.use("/reportes", require("./reportes"));
router.use("/parametros", require("./parametros"));
router.use("/usuarios", require("./usuarios"));
router.use("/tienda", require("./tienda"));
router.use("/historial-laboral", require("./historial"));

module.exports = router;
