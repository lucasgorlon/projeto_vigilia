const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Configurações essenciais
app.use(cors());
app.use(express.json());

// A porta será definida pela Railway (process.env.PORT) ou será 3000 localmente
const PORT = process.env.PORT || 3000;

// Rota principal para teste no navegador
app.get('/', (req, res) => {
    res.send("Servidor de Vigília Ativo na Nuvem!");
});

// Rota de Check-in
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

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});