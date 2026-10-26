import express from "express";
import cors from "cors";
import refeicaoRoutes from "./routes/refeicaoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js"

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Cardápio Escolar funcionando!"
    });
});

app.use("/refeicoes", refeicaoRoutes);

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});

app.use(cors());
app.use(express.json());

app.use("/usuarios", usuarioRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});