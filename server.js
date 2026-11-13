
import express from "express";
import cors from "cors";

import refeicaoRoutes from "./routes/refeicaoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import sugestaoRoutes from "./routes/sugestaoRoutes.js";
import relatorioRoutes from "./routes/relatorioRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do Cardápio Escolar funcionando!"
    });
});

app.use("/refeicoes", refeicaoRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/sugestoes", sugestaoRoutes);
app.use("/relatorios", relatorioRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
