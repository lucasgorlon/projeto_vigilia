const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// A porta 3000 é mais estável para o mapeamento da Railway que você configurou
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send("OK");
});

app.post('/checkin', (req, res) => {
    // Definindo o horário corretamente
    const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Log para depuração (corrigido sem parêntese extra)
    console.log("Dados recebidos do celular:", req.body);

    const { senha } = req.body;

    // Verificação robusta da senha
    if (senha && String(senha).trim() === "1234") { 
        const logMsg = `Presença confirmada em: ${horario}\n`;
        
        fs.appendFile('log.txt', logMsg, (err) => {
            if (err) console.error("Erro ao salvar log:", err);
        });

        console.log(logMsg);
        return res.status(200).send("OK");
    }
    
    console.log(`Tentativa de acesso negada. Senha recebida: "${senha}"`);
    res.status(401).send("Senha incorreta");
}); // Fechamento correto da rota

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});