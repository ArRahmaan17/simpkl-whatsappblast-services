const express = require('express')
const qrcode = require('qrcode-terminal');
const app = express()
const port = 3000;
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    puppeteer: {
        puppeteer: {
            args: ['--no-sandbox'],
        },
        headless: true,
    },
    authStrategy: new LocalAuth({
        clientId: "maman",
    }),
});

app.listen(port, () => {
    console.log(`Application Started`);
})
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const bodyParser = require('body-parser')
    const multer = require('multer')
    const upload = multer()
    app.get('/', async (req, res) => {
        res.send('Whatsapp Services SIM PKL')
    });

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.post('/attendance-warning', upload.array(), async (req, res) => {
        let replyMessage = `Di informasikan kepada:\n`;
        let mentions = [];
        let chats = await client.getChats();
        chats = chats.find(chat => { return chat.name == 'Nitip Bro' });
        phone_numbers = JSON.parse(req.body.phone_number);
        for (let participant of chats.groupMetadata.participants) {
            if (participant.id.user != '6285173007324' && phone_numbers.includes(`${participant.id.user.split('62').join('')}`)) {
                const contact = await client.getContactById(participant.id._serialized);
                replyMessage += `@${participant.id.user} \n`;
                mentions.push(contact)
            }
        }
        replyMessage += 'Mohon untuk segera melakukan absensi di https://sim-pkl.nugcreative.my.id/';
        chats.sendMessage(replyMessage, { mentions });
        res.send({ 'status': 'Success', 'Message': "Test Success" });
    })
});
client.initialize();