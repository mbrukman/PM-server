const request = require('supertest');
const {isConnected} = require('./helpers/mongoose-connect');
const env = require('../../env/enviroment')
const baseUrl = 'localhost:3000'

describe("Settings Api", () => {

    it('GET /', async (done) => {
        try{
            let connect = await isConnected();      
            request(baseUrl).get(`/api/settings`)
                .withCredentials()
                .expect(200)
                .end(function (err, res) {
                    expect(res.body.isSetup).toBe(connect)
                    expect(res.body.version).toBe(env.version)
                    done();
                  })
              
        }catch (err) {
            console.log(err.message);
            throw err;
        }

    })

    describe('Positive',()=>{
        it('POST /', async (done) => {
            let url = 'mongodb://localhost/test';
            try{    
                request(baseUrl)
                .post(`/api/settings/db`)
                .send({uri:url})
                .withCredentials()
                .expect(204)
                .end(function (err, res) {
                    done();
                  });
            }catch (err) {
                console.log(err.message);
                throw err;
            }
    
        })
    })

    describe('Negative',()=>{
        it('POST /', async (done) => {
            let url = '';
            try{    
                request(baseUrl)
                .post(`/api/settings/db`)
                .send({uri:url})
                .withCredentials()
                .expect(500)
                .end(function (err, res) {
                    done();
                  });

            }catch (err) {
                console.log(err.message);
                throw err;
            }
    
        })
    })
})