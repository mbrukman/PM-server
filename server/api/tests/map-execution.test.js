
/*
router.post("/:id/execute", mapController.execute);
router.post("/:id/execute/:structure", mapController.execute);
router.get("/:id/stop-execution", mapController.stopExecution);
router.get("/:id/stop-execution/:runId", mapController.stopExecution);
router.post("/:id/cancel-pending", mapController.cancelPending);
router.get("/currentruns", mapController.currentRuns);

/api/maps

*/

const request = require('supertest');
const MapModel = require('../../api/models/map.model');
const TestDataManager = require('./factories/test-data-manager');
const mapsFactory = require('./factories/maps.factory');
const {setupDB} = require('./helpers/test-setup')
const app = 'localhost:3000';

describe('Map execution tests', () => {
    let testDataManager;
    let mapId;
    setupDB();

    beforeEach(async () => {
        testDataManager = new TestDataManager(MapModel);
        const map = mapsFactory.generateSimpleMap();
        await testDataManager.generateInitialCollection(map);
        mapId = map._id;
    });

    describe('POST /api/maps/:mapId/execute', () => {
        it(`should handle lack of map structure`, ()=> {
            return request(app)
                .post(`/api/maps/${mapId}/execute`)
                .expect(500)
                .then(({text}) => {
                    expect(text).toBe('No structure found.');
                })
        });
    });

    describe('POST /api/maps/currentRuns', () => {
        it(`should return {} for no current runs`, ()=> {
            return request(app)
                .post(`/api/maps/currentRuns`)
                .expect(200)
                .then(({body}) => {
                    expect(body).toEqual({});
                })
        });
    });

});
