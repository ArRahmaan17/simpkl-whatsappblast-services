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
        const date = new Date();
        const uniqueSuffix = `${date.getDate()}${date.getMonth()}${date.getFullYear()}.${extension}`;
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
        chats = chats.find(chat => { return chat.name == 'PKL Nug Creative' });
        // chats = chats.find(chat => { return chat.name == 'Nitip Bro' });
        phone_numbers = JSON.parse(req.body.phone_number);
        for (let participant of chats.groupMetadata.participants) {
            if (participant.id.user != '6287846725064' && phone_numbers.includes(`${participant.id.user.split('62').join('')}`)) {
                replyMessage += `@${participant.id.user} \n`;
                mentions.push(participant.id._serialized)
            }
        }
        replyMessage += 'Mohon untuk segera melakukan absensi di https://sim-pkl.nugcreative.my.id/';
        if (mentions.length == 0) {
            replyMessage = `Semua Telah Melakukan Absensi.\n Semangat pkl hari ini 🔥🔥🔥`;
        }
        chats.sendMessage(replyMessage, { mentions: mentions });
        res.send({ 'status': 'Success', 'Message': "Success send notification for all users" });
    });
    // Attendance Warning for user
    // app.get('/attendance-warning/:phone_number', upload.array(), async (req, res) => {
    //     client.sendMessage(`62${req.params.phone_number}@c.us`, `Di informasikan kepada *62${req.params.phone_number}* untuk segera melakukan presensi https://sim-pkl.nugcreative.my.id/`);
    //     res.send({ 'status': 'Success', 'Message': "Success send notification for" + req.params.phone_number });
    // });
    // Attendance Success for user
    app.post('/attendance-success/:phone_number/:status', upload.single('file_attendance'), async (req, res) => {
        let chats = await client.getChats();
        chats = chats.find(chat => { return chat.name == 'PKL Nug Creative' });
        // chats = chats.find(chat => { return chat.name == 'Nitip Bro' });
        let replyMessage = '';
        let mentions = [];
        for (let participant of chats.groupMetadata.participants) {
            if (participant.id.user != '6287846725064' && req.params.phone_number == `${participant.id.user.split('62').join('')}`) {
                replyMessage += `@${participant.id.user} telah melakukan absensi ${req.params.status}`;
                mentions.push(participant.id._serialized)
            }
        }
        const media = MessageMedia.fromFilePath(req.file.path);
        chats.sendMessage(media, { mentions: mentions, caption: replyMessage });
        res.send({ 'status': 'Success', 'Message': "Success send notification for" + req.params.phone_number });
    });

    // app.post('/attendance-notification/:phone_number/:student_phone_number', upload.single('file_attendance'), async (req, res) => {
    //     const media = MessageMedia.fromFilePath(req.file.path);
    //     client.sendMessage(`62${req.params.phone_number}@c.us`, media, { caption: `62${req.params.student_phone_number} melakukan absensi` });
    //     res.send({ 'status': 'Success', 'Message': "Success send notification for " + req.params.phone_number });
    // });
    app.post('/task-notification', upload.single('task_thumbnail'), async (req, res) => {
        let chats = await client.getChats();
        chats = chats.find(chat => { return chat.name == 'PKL Nug Creative' });
        // chats = chats.find(chat => { return chat.name == 'Nitip Bro' });
        phone_numbers = JSON.parse(req.body.phone_numbers);
        let replyMessage = '';
        let mentions = [];
        for (let participant of chats.groupMetadata.participants) {
            if (participant.id.user != '6287846725064' && phone_numbers.includes(`${participant.id.user.split('62').join('')}`)) {
                replyMessage += `@${participant.id.user} \n`;
                mentions.push(participant.id._serialized)
            }
        }
        replyMessage += `\nDiinformasikan tugas baru tentang *${req.body.title}* telah tiba🤣`
        const media = MessageMedia.fromFilePath(req.file.path);
        chats.sendMessage(media, { mentions: mentions, caption: replyMessage });
        res.send({ 'status': 'Success', 'Message': "Success send notification for all user in group" });
    });
});
client.initialize();