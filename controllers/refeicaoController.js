import pool from "../database.js";

export async function create(req, res) {
    try {
        const {
            nomeRefeicao,
            descricao,
            categoria
        } = req.body;

        const resultado = await pool.query(
            `INSERT INTO refeicao
            (nomeRefeicao, descricao, categoria)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                nomeRefeicao,
                descricao,
                categoria
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        res.status(500).json({
            erro: "Erro ao cadastrar refeição",
            detalhe: error.message
        });
    }
}

export async function findAll(req, res) {
    try {

        const resultado = await pool.query(
            "SELECT * FROM refeicao ORDER BY id_refeicao"
        );

        res.json(resultado.rows);

    } catch (error) {

        res.status(500).json({
            erro: "Erro ao buscar refeições",
            detalhe: error.message
        });

    }
}

export async function findById(req, res) {
    try {

        const { id } = req.params;

        const resultado = await pool.query(
            "SELECT * FROM refeicao WHERE id_refeicao = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Refeição não encontrada"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {

        res.status(500).json({
            erro: "Erro ao buscar refeição",
            detalhe: error.message
        });

    }
}

export async function update(req, res) {
    try {

        const { id } = req.params;

        const {
            nomeRefeicao,
            descricao,
            categoria
        } = req.body;

        const resultado = await pool.query(
            `UPDATE refeicao
             SET nomeRefeicao = $1,
                 descricao = $2,
                 categoria = $3
             WHERE id_refeicao = $4
             RETURNING *`,
            [
                nomeRefeicao,
                descricao,
                categoria,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Refeição não encontrada"
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {

        res.status(500).json({
            erro: "Erro ao atualizar refeição",
            detalhe: error.message
        });

    }
}

export async function remove(req, res) {
    try {

        const { id } = req.params;

        const resultado = await pool.query(
            "DELETE FROM refeicao WHERE id_refeicao = $1 RETURNING *",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Refeição não encontrada"
            });
        }

        res.json({
            mensagem: "Refeição excluída com sucesso",
            refeicao: resultado.rows[0]
        });

    } catch (error) {

        res.status(500).json({
            erro: "Erro ao excluir refeição",
            detalhe: error.message
        });

    }
}