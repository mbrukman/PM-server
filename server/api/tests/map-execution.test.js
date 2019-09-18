const request = require('supertest');
const MapModel = require('../../api/models/map.model');
const TestDataManager = require('./factories/test-data-manager');
const mapsFactory = require('./factories/maps.factory');
const { setupDB } = require('./helpers/test-setup')
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

    // router.post("/:id/execute", mapController.execute);
    describe('POST /api/maps/:mapId/execute', () => {
        it(`should handle lack of map`, () => {
            const mapId = mapsFactory.generateSimpleMap()._id;
            return request(app)
                .post(`/api/maps/${mapId}/execute`)
                .expect(500)
                .then(({ text }) => {
                    expect(text).toBe('Couldn\'t find map');
                })
        });

        it(`should handle lack of map structure`, () => {
            return request(app)
                .post(`/api/maps/${mapId}/execute`)
                .expect(500)
                .then(({ text }) => {
                    expect(text).toBe('No structure found.');
                })
        });

        it(`should not execute an archived map`, async () => {
            await MapModel.findByIdAndUpdate(mapId, {archived: true});
            return request(app)
                .post(`/api/maps/${mapId}/execute`)
                .expect(500)
                .then(({ text }) => {
                    expect(text).toBe('Can\'t execute archived map');
                })
        });
    });

    // router.post("/:id/execute/:structure", mapController.execute);
    // NOTICE - THIS ROUTE IS NOT USED IN THE FRONTEND (KAH-37)
    describe('POST /api/maps/:mapId/execute/:structureId', () => {
        it(`should handle lack of map`, () => {
            const mapId = mapsFactory.generateSimpleMap()._id;
            const structureId = mapId;
            return request(app)
                .post(`/api/maps/${mapId}/execute/${structureId}`)
                .expect(500)
                .then(({ text }) => {
                    expect(text).toBe('Couldn\'t find map');
                })
        });

        it(`should handle lack of map structure`, () => {
            const structureId = mapId;
            return request(app)
                .post(`/api/maps/${mapId}/execute/${structureId}`)
                .expect(500)
                .then(({ text }) => {
                    expect(text).toBe('No structure found.');
                })
        });
    });

    // router.get("/:id/stop-execution", mapController.stopExecution);
    // NOTICE - THIS ROUTE IS NOT USED IN THE FRONTEND (KAH-38)
    describe('GET /api/maps/:mapId/stop-execution', () => {
        it(`should return {} for no executions stopped`, () => {
            return request(app)
                .get(`/api/maps/${mapId}/stop-execution`)
                .expect(200)
                .then(({ body }) => {
                    expect(body).toEqual({});
                });
        });
    });

    // router.get("/:id/stop-execution/:runId", mapController.stopExecution);
    describe('GET /api/maps/:mapId/stop-execution/:runId', () => {
        it(`should return {} for no executions stopped`, () => {
            const random = Math.floor(Math.random() * 10 + 1);
            return request(app)
                .get(`/api/maps/${mapId}/stop-execution/${random}`)
                .expect(200)
                .then(({ body }) => {
                    expect(body).toEqual({});
                });
        });
    });

    // router.post("/:id/cancel-pending", mapController.cancelPending);
    //  TODO: cancel pending will not reject / respond with 500 because of the bug (KAH-36)

    // router.get("/currentruns", mapController.currentRuns);
    describe('POST /api/maps/currentRuns', () => {
        it(`should return {} for no current runs`, () => {
            return request(app)
                .post(`/api/maps/currentRuns`)
                .expect(200)
                .then(({ body }) => {
                    expect(body).toEqual({});
                })
        });
    });
});
