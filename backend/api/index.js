const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/api/debug", (req, res) => { res.json({ instance: process.pid, time: new Date() }); });

app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

// Rotas
const routes = require("./routes/routes");
app.use("/api", routes);

// Porta (Railway usa automaticamente)
const PORT = process.env.PORT || 3000;

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("Erro na conexão:", error);
});

db.once("open", () => {
  console.log("Banco conectado com sucesso");
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});