const express = require('express')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const app = express();
const cors = require('cors')
const port = 3000;
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`my-uploads/${req.params.phone_number}/`)) {
            fs.mkdirSync(`my-uploads/${req.params.phone_number}/`);
        }
        cb(null, `my-uploads/${req.params.phone_number}/`)
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split('.')[1]
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
const upload = multer({ storage: storage })
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    },
    authStrategy: new LocalAuth({
        clientId: "Maman",
    }),
});
app.use(cors())
app.listen(port, () => {
    console.log(`Application Started`);
})
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const bodyParser = require('body-parser')
    app.get('/', async (req, res) => {
        res.send('Whatsapp Services SIM PKL')
    });

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }));
    // Attendance Warning for users    
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
        res.send({ 'status': 'Success', 'Message': "Success send notification for all users" });
    });
    // Attendance Warning for user
    app.get('/attendance-warning/:phone_number', upload.array(), async (req, res) => {
        const contact = await client.getContactById(`62${req.params.phone_number}@c.us`);
        client.sendMessage(`62${req.params.phone_number}@c.us`, `Di informasikan kepada *${contact.name}* untuk segera melakukan presensi https://sim-pkl.nugcreative.my.id/`);
        res.send({ 'status': 'Success', 'Message': "Success send notification for" + req.params.phone_number });
    });
    // Attendance Success for user
    app.get('/attendance-success/:phone_number/:status', upload.array(), async (req, res) => {
        const contact = await client.getContactById(`62${req.params.phone_number}@c.us`);
        client.sendMessage(`62${req.params.phone_number}@c.us`, `Hai *${contact.name}*, Anda telah berhasil melakukan presensi ${req.params.status}`);
        res.send({ 'status': 'Success', 'Message': "Success send notification for" + req.params.phone_number });
    });
    app.post('/attendance-notification/:phone_number', upload.single('file_attendance'), async (req, res) => {
        const contact = await client.getContactById(`62${req.params.phone_number}@c.us`);
        const media = MessageMedia.fromFilePath(req.file.path);
        client.sendMessage(`62${req.params.phone_number}@c.us`, media, { caption: `${contact.name} melakukan absensi` });
        res.send({ 'status': 'Success', 'Message': "Success send notification for" + req.params.phone_number });
    });
});
client.initialize();