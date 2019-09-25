const request = require('supertest');
const { connectToSocket, generateMapStructure } = require('./helpers');
const baseUrl = 'localhost:3000';
const apiURL = `${baseUrl}/api`;


function executeMap(mapId){
    return request(apiURL)
    .post(`/maps/${mapId}/execute`)
    .expect(200)
    .then(({ body }) => {
        expect(body.runId).toBeDefined();
        expect(typeof body.runId).toBe('string');
        expect(body.runId.length > 0).toBe(true);
        expect(body.mapId).toBe(mapId);
    })
}

describe('Websocket listens to events after pending execution update', () => {
    let io, mapId;
    beforeEach(async () => {
        io = await connectToSocket();
        mapId = await generateMapStructure();
    });

    afterEach(() => {
        io.close();
    });

    it('testing ws', async (done) => {
        io.on('pending', (data) => {
            console.log(data)
            done();
        });
        await executeMap(mapId)
    })
});