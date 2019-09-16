const request = require('supertest');
const mongoose = require('mongoose');
const env = require('../../env/enviroment')
const fs = require('fs');
const path = require("path");
let config = require('../../env/config');
const baseApiURL = 'http://127.0.0.1:3000/api';

describe("Settings Api", () => {

    beforeAll(async () => {
        delete config.dbURI;
        config = Object.assign({}, config);
        fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
        //await mongoose.connect('mongodb://localhost/testing', {useNewUrlParser: true})
    })

    //  afterAll(async () => {
    //     await mongoose.disconnect();
    // })

    describe('Negative',() => {
        it('GET /', async () => {
            delete config.dbURI;
            config = Object.assign({}, config);
            fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
            return request(baseApiURL).get(`/settings`)
                .expect(200)
                .then(res => {
                    expect(res.body.isSetup).toBe(false)
                    expect(res.body.version).toBe(env.version)
                    })
                
        })

        it('POST /db', async (done) => {
            let url = ''; 
            return request(baseApiURL)
            .post(`/settings/db`)
            .send({uri:url})
            .expect(500,done)
    
        })
    })


    describe('Positive',() => {

        it('POST /db', async (done) => {
            let url = 'mongodb://localhost/test';
   
            return request(baseApiURL)
            .post(`/settings/db`)
            .send({uri:url})
            .expect(204,done)
    
        })

        it('GET /', async () => {
   
            return request(baseApiURL).get(`/settings`)
                .expect(200)
                .then(res => {
                    expect(res.body.isSetup).toBe(true)
                    expect(res.body.version).toBe(env.version)
                    })

        })
    })
})