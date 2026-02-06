const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Expo } = require('expo-server-sdk');
const cron = require('node-cron');

const app = express();
// Configuração da instância da Expo com o Access Token
const expo = new Expo({ accessToken: 'VWFlHH6lspasMWBrR-nAx87rBFZ2Pgns2K35Y1hn' });

// Vínculo com as credenciais do Google Firebase
const serviceAccount = require('./vigilia-tecnoi-i-firebase-adminsdk-fbsvc-7516f82cd1.json'); 

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
// Token atualizado após o reset de cache do Xiaomi
const PUSH_TOKEN = 'ExponentPushToken[7OjQzcHzXZi4LGhlqy4kW5]';

// --- ROTAS ---

app.get('/', (req, res) => {
    res.status(200).send("OK");
});

app.post('/checkin', (req, res) => {
    const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
    const { senha } = req.body;

    if (senha && String(senha).trim() === "1234") { 
        const logMsg = `Presença confirmada em: ${horario}\n`;
        fs.appendFile('log.txt', logMsg, (err) => {
            if (err) console.error("Erro ao salvar log:", err);
        });
        console.log(logMsg);
        return res.status(200).send("OK");
    }
    res.status(401).send("Senha incorreta");
});

app.get('/ver-logs', (req, res) => {
    const auth = { user: 'admin', pass: 'Tecnoi.22' };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (user === auth.user && pass === auth.pass) {
        const filePath = path.join(__dirname, 'log.txt');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return res.status(500).send("Erro ao ler logs.");
            const linhas = data.split('\n').filter(l => l.trim() !== "");
            const tabelaRows = linhas.map(l => `<tr><td>${l}</td></tr>`).join('');
            res.send(`<html><body><h2>🔒 Painel Vigília</h2><table>${tabelaRows}</table></body></html>`);
        });
    } else {
        res.set('WWW-Authenticate', 'Basic realm="Acesso Restrito"');
        res.status(401).send('Acesso negado.');
    }
});

// --- LÓGICA DE NOTIFICAÇÃO ---

const dispararAlertaVigilia = async () => {
    if (!Expo.isExpoPushToken(PUSH_TOKEN)) {
        console.error(`ERRO CRÍTICO: Token inválido registrado no servidor: ${PUSH_TOKEN}`);
        return;
    }

    const messages = [{
        to: PUSH_TOKEN,
        sound: 'default',
        title: '🚨 VIGÍLIA TECNO I',
        body: 'CONFIRME SUA PRESENÇA AGORA!',
        priority: 'high',
        projectId: 'fb526cf5-889b-47b5-af35-1df44d500f3d', 
        experienceId: '@sgorlonlucas/servidor-vigilia',
        channelId: 'vigilia-alerta',
        
        // Configurações específicas para forçar o Pop-up no Android/Xiaomi
        android: {
            priority: 'max',
            channelId: 'vigilia-alerta', // Repita aqui para garantir      
            vibrate: [0, 250, 250, 250], 
            sound: true,
            badge: true,
        },
        
        _displayInForeground: true, 
    }];

    try {
        const ticketChunks = await expo.sendPushNotificationsAsync(messages);
        console.log("Resposta da Expo:", JSON.stringify(ticketChunks));
        
        if (ticketChunks[0].status === 'error') {
            console.error(`Erro detalhado: ${ticketChunks[0].message}`);
            if (ticketChunks[0].details?.error === 'DeviceNotRegistered') {
                console.error("ALERTA: O Token do celular expirou ou o app foi desinstalado.");
            }
        }
    } catch (error) {
        console.error("Erro na requisição para a Expo:", error);
    }
};

// Rota de teste manual
app.get('/teste-alerta', (req, res) => {
    dispararAlertaVigilia(); 
    res.send("Alerta disparado!");
});

// --- AGENDAMENTO AUTOMÁTICO (CRON) ---

cron.schedule('0,30 12,13,14,15,16,17,18,19 * * *', () => {
    console.log("⏰ Cron: Disparando alerta de rotina (30 min)");
    dispararAlertaVigilia();
}, {
    scheduled: true,
    timezone: "America/Manaus"
});

cron.schedule('0 5 * * *', () => {
    console.log("⏰ Cron: Disparo final das 05:00");
    dispararAlertaVigilia();
}, {
    scheduled: true,
    timezone: "America/Manaus"
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT} - Fuso: Manaus`);
});