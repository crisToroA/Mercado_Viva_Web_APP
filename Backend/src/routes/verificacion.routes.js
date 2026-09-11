const express = require("express");
const router = express.Router();
const { verificarDisponibilidad } = require("../controllers/verificacion.controller");

router.post("/", verificarDisponibilidad);

module.exports = router;