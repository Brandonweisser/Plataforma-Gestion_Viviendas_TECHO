const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3001;
const SECRET = "tu_clave_secreta"; // Cambia esto por algo seguro

app.use(cors());
app.use(bodyParser.json());

// Usuario de prueba
const usuarioDemo = {
  email: "admin@techo.org",
  password: "123456"
};

// Endpoint de login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email === usuarioDemo.email && password === usuarioDemo.password) {
    // Genera token
    const token = jwt.sign({ email }, SECRET, { expiresIn: "2h" });
    res.json({ success: true, token });
  } else {
    res.json({ success: false, message: "Correo o contraseña incorrectos." });
  }
});

// Endpoint protegido de ejemplo
app.get("/api/protegido", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No autorizado" });
  try {
    const token = auth.split(" ")[1];
    jwt.verify(token, SECRET);
    res.json({ message: "Acceso permitido" });
  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});