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

const { Expo } = require('expo-server-sdk');
const expo = new Expo();

// Importante: Substitua pelo código que aparecerá no alerta do seu celular
const PUSH_TOKEN = 'ExponentPushToken[TUykvYGCdlA3txOXoe5yD_]';

const dispararAlertaVigilia = async () => {
    // 1. Verificação de segurança para não travar o servidor
    if (!PUSH_TOKEN.includes("ExponentPushToken")) {
        console.error("ERRO: O PUSH_TOKEN ainda não foi configurado com o código do celular.");
        return;
    }

    if (!Expo.isExpoPushToken(PUSH_TOKEN)) {
        console.error(`Token de push inválido: ${PUSH_TOKEN}`);
        return;
    }

    const messages = [{
        to: PUSH_TOKEN,
        sound: 'default',
        title: '🚨 VIGÍLIA TECNO I',
        body: 'CONFIRME SUA PRESENÇA AGORA!',
        priority: 'high', // Essencial para acordar o Android
        channelId: 'alerta-v1', 
    }];

    try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log("Alerta enviado com sucesso:", ticketChunk);
    } catch (error) {
        console.error("Erro ao enviar notificação:", error);
    }
};

// Lógica de agendamento corrigida (Fuso Horário e Intervalo)
setInterval(() => {
    // Criamos uma data baseada no fuso horário de Manaus
    const agoraManaus = new Date().toLocaleString("en-US", {timeZone: "America/Manaus"});
    const data = new Date(agoraManaus);
    
    const hora = data.getHours();
    const minutos = data.getMinutes();

    // Verificação de teste: imprime no log da Railway para você ver se o relógio está certo
    console.log(`Relógio do Servidor (Manaus): ${hora}:${minutos}`);

    // Dispara às 21:30, 22:00, 22:30... até as 05:00
    if ((hora >= 21 || hora < 5) && (minutos === 0 || minutos === 30)) {
        console.log(`⏰ HORÁRIO ATINGIDO! Disparando para o token: ${PUSH_TOKEN}`);
        dispararAlertaVigilia();
    }
}, 60000); // Alterado para 60000 (1 minuto) para não pular o horário exatos

// Rota de teste corrigida para usar o nome certo da função
app.get('/teste-alerta', (req, res) => {
    console.log("Recebido comando manual de teste via navegador.");
    
    // Chamando a função correta que você criou acima
    dispararAlertaVigilia(); 
    
    res.send("Comando de alerta enviado para a Expo! Verifique seu celular.");
});
