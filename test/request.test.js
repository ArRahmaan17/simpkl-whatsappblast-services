const test = require('jest');
const express = require('express')
const app = express();
const request = require('supertest');

app.get('/', async (req, res) => {
    res.send('Whatsapp Services SIM PKL')
});

describe('GET /', () => {
    it("should return home page", async () => {
        let response = await request(app).get('/');
        expect(response.text).toBe('Whatsapp Services SIM PKL');
    })
})
