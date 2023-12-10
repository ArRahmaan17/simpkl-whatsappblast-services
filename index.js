const express = require('express')
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const app = express();
const cors = require('cors')
const port = 2000;
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'task-files';
        if (req.params.phone_number != undefined) {
            folder = req.params.phone_number;
        }
        if (!fs.existsSync(`my-uploads/${folder}/`)) {
            fs.mkdirSync(`my-uploads/${folder}/`);
        }
        cb(null, `my-uploads/${folder}/`)
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split('.')[1]
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
const upload = multer({ storage: storage });
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
    client.on('message', function (message) {
        if (message.body == 'test') {
            message.reply('bot is online 🇵🇸');
        }
    })

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
    app.post('/attendance-notification/:phone_number/:student_phone_number', upload.single('file_attendance'), async (req, res) => {
        const student_contact = await client.getContactById(`62${req.params.student_phone_number}@c.us`);
        const media = MessageMedia.fromFilePath(req.file.path);
        client.sendMessage(`62${req.params.phone_number}@c.us`, media, { caption: `${student_contact.name} melakukan absensi` });
        res.send({ 'status': 'Success', 'Message': "Success send notification for " + req.params.phone_number });
    });
    app.post('/task-notification', upload.single('task_thumbnail'), async (req, res) => {
        let chats = await client.getChats();
        chats = chats.find(chat => { return chat.name == 'Nitip Bro' });
        phone_numbers = JSON.parse(req.body.phone_numbers);
        let replyMessage = '';
        let mentions = [];
        for (let participant of chats.groupMetadata.participants) {
            if (participant.id.user != '6285173007324' && phone_numbers.includes(`${participant.id.user.split('62').join('')}`)) {
                const contact = await client.getContactById(participant.id._serialized);
                replyMessage += `@${participant.id.user} \n`;
                mentions.push(contact)
            }
        }
        replyMessage += `\nDiinformasikan tugas baru tentang *${req.body.title}* telah tiba🤣`
        const media = MessageMedia.fromFilePath(req.file.path);
        chats.sendMessage(media, { mentions: mentions, caption: replyMessage })
        // client.sendMessage(`62${req.params.phone_number}@c.us`, media, { caption: `${contact.name} melakukan absensi` });
        res.send({ 'status': 'Success', 'Message': "Success send notification for all user in group" });
    });
});
client.initialize();