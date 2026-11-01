const express = require("express");
const { makeCrudController } = require("../utils/genericCrud");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();
const ctrl = makeCrudController("puesto", "id_puesto", ["nombre", "descripcion"]);

router.get("/", ctrl.listAll);
router.get("/:id", ctrl.getById);
router.post("/", permitirRoles("Administrador"), ctrl.create);
router.put("/:id", permitirRoles("Administrador"), ctrl.update);
router.delete("/:id", permitirRoles("Administrador"), ctrl.remove);

module.exports = router;
