const request = require('supertest');
const mongoose = require('mongoose');
const env = require('../../env/enviroment')
const app = require('../../app');
const fs = require('fs');
const path = require("path");
let config = require('../../env/config');

describe("Settings Api", () => {

    beforeAll(async () => {
        delete config.dbURI;
        config = Object.assign({}, config);
        fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
        await mongoose.connect('mongodb://localhost/testing', {useNewUrlParser: true})
    })

     afterAll(async () => {
        await mongoose.disconnect();
    })

    describe('Negative',() => {
        it('GET /', async (done) => {
            delete config.dbURI;
            config = Object.assign({}, config);
            fs.writeFileSync(path.join(__dirname, '../../env/config.json'), JSON.stringify(config));
            try{  
                request(app).get(`/api/settings`)
                    .withCredentials()
                    .expect(200)
                    .then(res => {
                        expect(res.body.isSetup).toBe(false)
                        expect(res.body.version).toBe(env.version)
                        done();
                      })
                  
            }catch (err) {
                console.log(err.message);
                throw err;
            }
        })

        it('POST /db', async (done) => {
            let url = '';
            try{    
                request(app)
                .post(`/api/settings/db`)
                .send({uri:url})
                .withCredentials()
                .expect(500)
                .then(res => {
                    done();
                  });

            }catch (err) {
                console.log(err.message);
                throw err;
            }
    
        })
    })


    describe('Positive',() => {

        it('POST /db', async (done) => {
            let url = 'mongodb://localhost/test';
            try{    
                request(app)
                .post(`/api/settings/db`)
                .send({uri:url})
                .withCredentials()
                .expect(204)
                .then(res => {
                    done();
                  });
            }catch (err) {
                console.log(err.message);
                throw err;
            }
    
        })

        it('GET /', async (done) => {
            
            try{    
                request(app).get(`/api/settings`)
                    .withCredentials()
                    .expect(200)
                    .then(res => {
                        expect(res.body.isSetup).toBe(true)
                        expect(res.body.version).toBe(env.version)
                        done();
                      })
                  
            }catch (err) {
                console.log(err.message);
                throw err;
            }
        })
    })
})