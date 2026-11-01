const express = require("express");
const { makeCrudController } = require("../utils/genericCrud");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();
const ctrl = makeCrudController(
  "parametro_legal",
  "id_parametro",
  ["nombre", "valor", "vigente_desde", "vigente_hasta"]
);

// RF-13: permitir configurar y actualizar los parametros legales
// (IGSS, ISR, bonificacion decreto) sin modificar el codigo fuente.
// Lectura abierta a cualquier usuario autenticado; escritura solo Administrador.
router.get("/", ctrl.listAll);
router.get("/:id", ctrl.getById);
router.post("/", permitirRoles("Administrador"), ctrl.create);
router.put("/:id", permitirRoles("Administrador"), ctrl.update);
router.delete("/:id", permitirRoles("Administrador"), ctrl.remove);

module.exports = router;
