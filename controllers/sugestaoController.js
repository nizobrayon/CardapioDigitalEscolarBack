import pool from "../database.js";

const STATUS_PERMITIDOS = ["Pendente", "Aceita", "Recusada"];

export async function create(req, res) {
  const { idUsuario, nomePrato, descricao } = req.body;
  const nome = typeof nomePrato === "string" ? nomePrato.trim() : "";
  const texto = typeof descricao === "string" ? descricao.trim() : "";

  if (!idUsuario || !nome || !texto) {
    return res.status(400).json({
      mensagem: "Informe o aluno, o nome do prato e a descrição.",
    });
  }

  if (texto.length > 300) {
    return res.status(400).json({
      mensagem: "A descrição pode ter no máximo 300 caracteres.",
    });
  }

  try {
    const aluno = await pool.query(
      "SELECT idaluno FROM aluno WHERE idusuario = $1",
      [idUsuario]
    );

    if (aluno.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Aluno não encontrado.",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO sugestao
        (idaluno, nomecomidasugestao, descricaosugestao)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [aluno.rows[0].idaluno, nome, texto]
    );

    return res.status(201).json({
      mensagem: "Sugestão registrada com sucesso!",
      sugestao: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao registrar sugestão:", erro);

    return res.status(500).json({
      mensagem: "Erro ao registrar sugestão.",
    });
  }
}

export async function findAll(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT
         s.idsugestao,
         s.nomecomidasugestao,
         s.descricaosugestao,
         s.statussugestao,
         s.datasugestao,
         a.idaluno,
         a.raaluno,
         u.nomeusuario
       FROM sugestao s
       JOIN aluno a ON a.idaluno = s.idaluno
       JOIN usuario u ON u.idusuario = a.idusuario
       ORDER BY s.datasugestao DESC, s.idsugestao DESC`
    );

    return res.json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao listar sugestões:", erro);

    return res.status(500).json({
      mensagem: "Erro ao listar sugestões.",
    });
  }
}

export async function updateStatus(req, res) {
  const { id } = req.params;
  const { statusSugestao } = req.body;

  if (!STATUS_PERMITIDOS.includes(statusSugestao)) {
    return res.status(400).json({
      mensagem: "O status deve ser Pendente, Aceita ou Recusada.",
    });
  }

  try {
    const resultado = await pool.query(
      `UPDATE sugestao
       SET statussugestao = $1
       WHERE idsugestao = $2
       RETURNING *`,
      [statusSugestao, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Sugestão não encontrada.",
      });
    }

    return res.json({
      mensagem: "Status da sugestão atualizado.",
      sugestao: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao atualizar sugestão:", erro);

    return res.status(500).json({
      mensagem: "Erro ao atualizar sugestão.",
    });
  }
}
