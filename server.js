const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// IMPORTANTE: Deixe o servidor escolher a porta da Railway automaticamente
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send("Servidor de Vigília Ativo na Nuvem!");
});

app.post('/checkin', (req, res) => {
    const { senha } = req.body;
    const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    if (senha === "1234") { 
        const log = `Presença confirmada em: ${horario}\n`;
        fs.appendFile('log.txt', log, (err) => {
            if (err) console.error("Erro ao salvar log:", err);
        });
        console.log(log);
        return res.status(200).send("OK");
    }
    res.status(401).send("Senha incorreta");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});