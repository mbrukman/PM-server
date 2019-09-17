
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
    setupDB();

    beforeEach(async () => {
        testDataManager = new TestDataManager(MapModel);
        const mapCollection = mapsFactory.generateSimpleMaps();
        await testDataManager.generateInitialCollection(
            mapCollection
        );
        const trigger = mapsFactory.createMap();
        triggerId = trigger._id;
        await testDataManager.pushToCollectionAndSave(trigger);
    });

    describe('Positive', () => {

    });

    describe('Negative', () => {

    });

});
