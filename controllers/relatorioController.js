import pool from "../database.js";

export async function create(req, res) {
  const { idUsuario } = req.body;

  if (!idUsuario) {
    return res.status(400).json({
      mensagem: "Informe a nutricionista.",
    });
  }

  try {
    const nutricionista = await pool.query(
      "SELECT idnutricionista FROM nutricionista WHERE idusuario = $1",
      [idUsuario]
    );

    if (nutricionista.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Nutricionista não encontrada.",
      });
    }

    const totais = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM feedback) AS totalfeedbaks,
         (SELECT COUNT(*)::int FROM sugestao) AS totalsugestoes,
         (SELECT ROUND(AVG(notafeedback), 2) FROM feedback) AS medianotas`
    );

    const ranking = await pool.query(
      `SELECT r.nomerefeicao, AVG(f.notafeedback) AS media, COUNT(*) AS total
       FROM feedback f
       JOIN refeicao r ON r.id_refeicao = f.idrefeicao
       GROUP BY r.id_refeicao, r.nomerefeicao
       ORDER BY media DESC, total DESC, r.nomerefeicao`
    );

    const maisAvaliada = ranking.rows[0]?.nomerefeicao ?? null;
    const menosAvaliada =
      ranking.rows.length > 0
        ? ranking.rows[ranking.rows.length - 1].nomerefeicao
        : null;

    const resultado = await pool.query(
      `INSERT INTO relatorio
        (idnutricionista, medianotas, totalfeedbaks, totalsugestoes,
         refeicaomaisavaliada, refeicaomenosavaliada)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nutricionista.rows[0].idnutricionista,
        totais.rows[0].medianotas,
        totais.rows[0].totalfeedbaks,
        totais.rows[0].totalsugestoes,
        maisAvaliada,
        menosAvaliada,
      ]
    );

    return res.status(201).json({
      mensagem: "Relatório gerado com sucesso!",
      relatorio: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao gerar relatório:", erro);

    return res.status(500).json({
      mensagem: "Erro ao gerar relatório.",
    });
  }
}

export async function findAll(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT
         r.idrelatorio,
         r.datacriacaorelatorio,
         r.medianotas,
         r.totalfeedbaks,
         r.totalsugestoes,
         r.refeicaomaisavaliada,
         r.refeicaomenosavaliada,
         n.idnutricionista,
         u.nomeusuario
       FROM relatorio r
       JOIN nutricionista n ON n.idnutricionista = r.idnutricionista
       JOIN usuario u ON u.idusuario = n.idusuario
       ORDER BY r.datacriacaorelatorio DESC, r.idrelatorio DESC`
    );

    return res.json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao listar relatórios:", erro);

    return res.status(500).json({
      mensagem: "Erro ao listar relatórios.",
    });
  }
}
