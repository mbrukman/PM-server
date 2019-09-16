const request = require('supertest');
const {setupDB} = require('./helpers/test-setup');
const MapStructureModel = require('../../api/models/map-structure.model');
const {mapFactory} = require('./factories');
const TestDataManager = require('./factories/test-data-manager');

const app = 'localhost:3000';

setupDB();

describe('Map revision endpoints should work correctly', () => {
    const testDataManager = new TestDataManager(MapStructureModel);

    beforeEach(async () => {
        console.log(await testDataManager.generateInitialCollection(
            mapFactory.generateMany()
        ))
    });

    describe('/GET works correctly', () => {
        it('should return single revision', () => {

        })
    })
});
