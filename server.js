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
    const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
    
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

const path = require('path');

// Rota para visualizar os logs em uma tabela simples
// Rota protegida para visualizar os logs
app.get('/ver-logs', (req, res) => {
    // Configuração da senha "Tecnoi.22"
    const auth = { user: 'admin', pass: 'Tecnoi.22' };

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Verifica se o usuário e senha estão corretos
    if (user && pass && user === auth.user && pass === auth.pass) {
        const filePath = path.join(__dirname, 'log.txt');
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return res.status(500).send("Erro ao ler logs ou arquivo vazio.");

            const linhas = data.split('\n').filter(linha => linha.trim() !== "");
            const tabelaRows = linhas.map(linha => `<tr><td>${linha}</td></tr>`).join('');

            res.send(`
                <html>
                    <head>
                        <title>Logs Restritos</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
                            table { width: 100%; border-collapse: collapse; background: white; }
                            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                            th { background-color: #333; color: white; }
                        </style>
                    </head>
                    <body>
                        <h2>🔒 Painel de Controle - Vigília</h2>
                        <table>
                            <thead><tr><th>Data, Hora e Status</th></tr></thead>
                            <tbody>${tabelaRows || "<tr><td>Sem registros.</td></tr>"}</tbody>
                        </table>
                        <br>
                        <button onclick="window.location.reload()">🔄 Atualizar</button>
                    </body>
                </html>
            `);
        });
    } else {
        // Se a senha estiver errada ou não enviada, pede o login
        res.set('WWW-Authenticate', 'Basic realm="Acesso Restrito"');
        res.status(401).send('Acesso negado. Senha incorreta.');
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});