import pool from "../database.js";

function notaValida(nota) {
  const numero = Number(nota);
  return Number.isInteger(numero) && numero >= 1 && numero <= 5;
}

export async function create(req, res) {
  const { idUsuario, idRefeicao, nota, comentario } = req.body;

  if (!idUsuario || !idRefeicao) {
    return res.status(400).json({
      mensagem: "Informe o aluno e a refeição.",
    });
  }

  if (!notaValida(nota)) {
    return res.status(400).json({
      mensagem: "A nota deve ser um número inteiro de 1 a 5.",
    });
  }

  const texto =
    comentario === undefined || comentario === null
      ? null
      : String(comentario).trim();

  if (texto && texto.length > 500) {
    return res.status(400).json({
      mensagem: "O comentário pode ter no máximo 500 caracteres.",
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

    const refeicao = await pool.query(
      "SELECT id_refeicao FROM refeicao WHERE id_refeicao = $1",
      [idRefeicao]
    );

    if (refeicao.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Refeição não encontrada.",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO feedback
        (idaluno, idrefeicao, comentariofeedback, notafeedback)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [aluno.rows[0].idaluno, idRefeicao, texto || null, Number(nota)]
    );

    return res.status(201).json({
      mensagem: "Avaliação registrada com sucesso!",
      feedback: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao registrar avaliação:", erro);

    return res.status(500).json({
      mensagem: "Erro ao registrar avaliação.",
    });
  }
}

export async function findAll(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT
         f.idfeedback,
         f.notafeedback,
         f.comentariofeedback,
         f.datafeedback,
         f.idrefeicao,
         r.nomerefeicao,
         a.idaluno,
         a.raaluno,
         u.nomeusuario
       FROM feedback f
       JOIN aluno a ON a.idaluno = f.idaluno
       JOIN usuario u ON u.idusuario = a.idusuario
       JOIN refeicao r ON r.id_refeicao = f.idrefeicao
       ORDER BY f.datafeedback DESC, f.idfeedback DESC`
    );

    return res.json(resultado.rows);
  } catch (erro) {
    console.error("Erro ao listar avaliações:", erro);

    return res.status(500).json({
      mensagem: "Erro ao listar avaliações.",
    });
  }
}
