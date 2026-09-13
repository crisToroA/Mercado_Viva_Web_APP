const express = require("express");
const router = express.Router();
const {
  verificarDisponibilidad,
  confirmarCompra,
  liberarCompra,
} = require("../controllers/verificacion.controller");

router.post("/", verificarDisponibilidad);
router.post("/:id/confirmar", confirmarCompra);
router.post("/:id/liberar", liberarCompra);

module.exports = router;