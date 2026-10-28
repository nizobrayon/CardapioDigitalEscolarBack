
/* ========================================
   BUSCAR PERFIL DO USUÁRIO======================================== */
import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../database.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      `SELECT
         u.idusuario,
         u.nomeusuario,
         u.emailusuario,
         a.raaluno
       FROM usuario u
       LEFT JOIN aluno a ON a.idusuario = u.idusuario
       WHERE u.idusuario = $1`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.json({
      usuario: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao buscar perfil:", erro);

    return res.status(500).json({
      mensagem: "Erro ao buscar perfil.",
    });
  }
});

/* ========================================
   ATUALIZAR PERFIL DO USUÁRIO
======================================== */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nomeUsuario, emailUsuario, raAluno } = req.body;

  if (!nomeUsuario?.trim() || !emailUsuario?.trim()) {
    return res.status(400).json({
      mensagem: "Informe o nome e o e-mail.",
    });
  }

  let conexao;

  try {
    conexao = await pool.connect();
    await conexao.query("BEGIN");

    const usuarioExiste = await conexao.query(
      "SELECT idusuario FROM usuario WHERE idusuario = $1",
      [id]
    );

    if (usuarioExiste.rows.length === 0) {
      await conexao.query("ROLLBACK");

      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    await conexao.query(
      `UPDATE usuario
       SET nomeusuario = $1, emailusuario = $2
       WHERE idusuario = $3`,
      [
        nomeUsuario.trim(),
        emailUsuario.trim().toLowerCase(),
        id,
      ]
    );

    // Atualiza o RA caso o usuário seja um aluno.
    if (raAluno !== undefined && String(raAluno).trim() !== "") {
      if (!/^\d+$/.test(String(raAluno).trim())) {
        await conexao.query("ROLLBACK");

        return res.status(400).json({
          mensagem: "Informe um RA válido.",
        });
      }

      await conexao.query(
        `UPDATE aluno
         SET raaluno = $1
         WHERE idusuario = $2`,
        [String(raAluno).trim(), id]
      );
    }

    await conexao.query("COMMIT");

    const resultado = await pool.query(
      `SELECT
         u.idusuario,
         u.nomeusuario,
         u.emailusuario,
         a.raaluno
       FROM usuario u
       LEFT JOIN aluno a ON a.idusuario = u.idusuario
       WHERE u.idusuario = $1`,
      [id]
    );

    return res.json({
      mensagem: "Perfil atualizado com sucesso!",
      usuario: resultado.rows[0],
    });
  } catch (erro) {
    if (conexao) {
      await conexao.query("ROLLBACK").catch(() => {});
    }

    console.error("Erro ao atualizar perfil:", erro);

    if (erro.code === "23505") {
      return res.status(409).json({
        mensagem: "Este e-mail ou RA já está cadastrado.",
      });
    }

    return res.status(500).json({
      mensagem: "Erro ao atualizar perfil.",
    });
  } finally {
    if (conexao) conexao.release();
  }
});

/* ========================================
   EXCLUIR CONTA DO USUÁRIO
======================================== */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  let conexao;

  try {
    conexao = await pool.connect();
    await conexao.query("BEGIN");

    const usuarioExiste = await conexao.query(
      "SELECT idusuario FROM usuario WHERE idusuario = $1",
      [id]
    );

    if (usuarioExiste.rows.length === 0) {
      await conexao.query("ROLLBACK");

      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    // Remove os registros vinculados ao usuário.
    await conexao.query(
      "DELETE FROM aluno WHERE idusuario = $1",
      [id]
    );

    await conexao.query(
      "DELETE FROM nutricionista WHERE idusuario = $1",
      [id]
    );

    // Exclui o usuário por último.
    await conexao.query(
      "DELETE FROM usuario WHERE idusuario = $1",
      [id]
    );

    await conexao.query("COMMIT");

    return res.json({
      mensagem: "Conta excluída com sucesso!",
    });
  } catch (erro) {
    if (conexao) {
      await conexao.query("ROLLBACK").catch(() => {});
    }

    console.error("Erro ao excluir conta:", erro);

    return res.status(500).json({
      mensagem:
        "Não foi possível excluir a conta. Verifique os registros vinculados.",
    });
  } finally {
    if (conexao) conexao.release();
  }
});

export default router;