
import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../database.js";

const router = Router();

// ========================================
// CADASTRO DE USUÁRIO
// ========================================
router.post("/", async (req, res) => {
  const {
    nomeUsuario,
    emailUsuario,
    senha,
    tipoUsuario,
    raAluno,
    crnNutricionista,
  } = req.body;

  if (
    !nomeUsuario?.trim() ||
    !emailUsuario?.trim() ||
    !senha ||
    !tipoUsuario
  ) {
    return res.status(400).json({
      mensagem: "Preencha todos os campos obrigatórios.",
    });
  }

  if (senha.length < 6) {
    return res.status(400).json({
      mensagem: "A senha deve ter pelo menos 6 caracteres.",
    });
  }

  if (!["aluno", "nutricionista"].includes(tipoUsuario)) {
    return res.status(400).json({
      mensagem: "Tipo de usuário inválido.",
    });
  }

  if (
    tipoUsuario === "aluno" &&
    (raAluno == null || !/^\d+$/.test(String(raAluno).trim()))
  ) {
    return res.status(400).json({
      mensagem: "Informe um RA válido para o aluno.",
    });
  }

  if (
    tipoUsuario === "nutricionista" &&
    (crnNutricionista == null ||
      !/^\d+$/.test(String(crnNutricionista).trim()))
  ) {
    return res.status(400).json({
      mensagem: "Informe um CRN válido.",
    });
  }

  let conexao;

  try {
    conexao = await pool.connect();
    await conexao.query("BEGIN");

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultadoUsuario = await conexao.query(
      `INSERT INTO usuario
        (nomeusuario, emailusuario, senhausuario)
       VALUES ($1, $2, $3)
       RETURNING idusuario, nomeusuario, emailusuario`,
      [
        nomeUsuario.trim(),
        emailUsuario.trim().toLowerCase(),
        senhaCriptografada,
      ]
    );

    const usuario = resultadoUsuario.rows[0];

    if (tipoUsuario === "aluno") {
      await conexao.query(
        `INSERT INTO aluno (idusuario, raaluno)
         VALUES ($1, $2)`,
        [usuario.idusuario, String(raAluno).trim()]
      );
    }

    if (tipoUsuario === "nutricionista") {
      await conexao.query(
        `INSERT INTO nutricionista
          (idusuario, crnnutricionista)
         VALUES ($1, $2)`,
        [
          usuario.idusuario,
          String(crnNutricionista).trim(),
        ]
      );
    }

    await conexao.query("COMMIT");

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      usuario,
    });
  } catch (erro) {
    if (conexao) {
      await conexao.query("ROLLBACK").catch(() => {});
    }

    console.error("Erro ao cadastrar usuário:", erro);

    if (erro.code === "23505") {
      return res.status(409).json({
        mensagem: "E-mail, RA ou CRN já cadastrado.",
      });
    }

    if (erro.code === "23503" || erro.code === "23502") {
      return res.status(400).json({
        mensagem:
          "Confira as colunas obrigatórias e os relacionamentos das tabelas no banco.",
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar usuário.",
    });
  } finally {
    if (conexao) conexao.release();
  }
});

// ========================================
// LOGIN DO ALUNO
// ========================================
router.post("/login", async (req, res) => {
  const { emailUsuario, raAluno, senha } = req.body;

  if (
    !emailUsuario?.trim() ||
    raAluno == null ||
    !String(raAluno).trim() ||
    !senha
  ) {
    return res.status(400).json({
      mensagem: "Informe o e-mail, o RA e a senha.",
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT
         u.idusuario,
         u.nomeusuario,
         u.emailusuario,
         u.senhausuario
       FROM usuario u
       INNER JOIN aluno a
         ON a.idusuario = u.idusuario
       WHERE LOWER(u.emailusuario) = LOWER($1)
         AND a.raaluno::text = $2`,
      [
        emailUsuario.trim(),
        String(raAluno).trim(),
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensagem: "E-mail, RA ou senha incorretos.",
      });
    }

    const usuario = resultado.rows[0];

    if (!usuario.senhausuario) {
      return res.status(401).json({
        mensagem: "E-mail, RA ou senha incorretos.",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senhausuario
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail, RA ou senha incorretos.",
      });
    }

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      usuario: {
        idusuario: usuario.idusuario,
        nomeusuario: usuario.nomeusuario,
        emailusuario: usuario.emailusuario,
      },
    });
  } catch (erro) {
    console.error("Erro ao realizar login:", erro);

    return res.status(500).json({
      mensagem: "Erro interno ao realizar login.",
    });
  }
});

export default router;
