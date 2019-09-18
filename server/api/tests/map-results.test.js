const {randomIdx} = require("./helpers");

const request = require('supertest');
const {setupDB} = require('./helpers/test-setup');
const {MapResult, AgentResultModel} = require('../../api/models/map-results.model');
const ProjectModel = require('../../api/models/project.model');
const MapStructure = require('../../api/models/map-structure.model');
const AgentModel = require('../../api/models/agent.model');
const {mapResultFactory, mapStructureFactory, mapsFactory, projectsFactory, agentResultFactory, agentFactory} = require('./factories');
const TestDataManager = require('./factories/test-data-manager');

const apiURL = 'localhost:3000/api';

setupDB();


describe('Map revisions endpoints should work correctly', () => {
    const mapResultTestDataManager = new TestDataManager(MapResult);
    const projectTestDataManager = new TestDataManager(ProjectModel);
    const agentResultsTestDataManager = new TestDataManager(AgentResultModel);
    const agentsTestDataManager = new TestDataManager(AgentModel);
    const mapStructureTestDataManager = new TestDataManager(MapStructure);
    let project;
    let map;

    beforeEach(async () => {
        await projectTestDataManager.generateInitialCollection(
            projectsFactory.generateProjects()
        );

        await agentsTestDataManager.generateInitialCollection((
            agentFactory.generateMany()
        ));



        await agentResultsTestDataManager.generateInitialCollection((
            agentResultFactory.generateMany(agentsTestDataManager.collection[0]._id)
        ));

        const randomIndex = randomIdx(projectTestDataManager.collection.length);
        project = projectTestDataManager.collection[randomIndex];
        map = await mapsFactory.createMap(project.id, project.name, 'random map name');
        await mapResultTestDataManager.generateInitialCollection(
            mapResultFactory.generateMany(map._id.toString(), [map])
        );
        await mapStructureTestDataManager.generateInitialCollection((
            mapStructureFactory.generateMany(map._id.toString(), [map])
        ));
    });

    // describe('/GET requests for requests of given map', () => {
    //     it('should return status 200 and all results assigned to the map', () => {
    //         return request(apiURL).get(`/maps/${map._id}/results`)
    //             .expect(200)
    //             .then(({body}) => {
    //                 expect.assertions(1);
    //                 expect(body.length).toEqual(mapResultTestDataManager.collection.length);
    //             })
    //     });

        // it('should return status 500 and return none of the results assigned to the map', () => {
        //     return request(apiURL).get(`/maps/undefined/results`)
        //         .expect(500)
        //         .then(({body}) => {
        //             expect.assertions(2);
        //             expect(body.name).toEqual('CastError');
        //             expect(body.message).toEqual('Cast to ObjectId failed for value "undefined" at path "map" for model "MapResult"');
        //         });
        // });
        //
        // it('should return status 200 and chosen result with given map id and result id', () => {
        //     const idx = randomIdx(mapResultTestDataManager.collection.length);
        //     const result = mapResultTestDataManager.collection[idx];
        //     return request(apiURL).get(`/maps/${map._id}/results/${result._id}`)
        //         .expect(200)
        //         .then(({body}) => {
        //             expect.assertions(3);
        //             expect(body.reason).toEqual(result.reason);
        //             expect(body.trigger).toEqual(result.trigger);
        //             expect(body._id).toEqual(result._id.toString());
        //         })
        // });
        //
        // it('should return status 200 and chosen result without given map id', () => {
        //     const idx = randomIdx(mapResultTestDataManager.collection.length);
        //     const result = mapResultTestDataManager.collection[idx];
        //     return request(apiURL).get(`/maps/undefined/results/${result._id}`)
        //         .expect(200)
        //         .then(({body}) => {
        //             expect.assertions(3);
        //             expect(body.reason).toEqual(result.reason);
        //             expect(body.trigger).toEqual(result.trigger);
        //             expect(body._id).toEqual(result._id.toString());
        //         });
        // });
        //
        //
        // it('should return status 500 and no result without given result id', () => {
        //     return request(apiURL).get(`/maps/${map._id}/results/undefined`)
        //         .expect(500)
        //         .then(({body}) => {
        //             expect.assertions(2);
        //             expect(body.name).toEqual('CastError');
        //             expect(body.message).toEqual('Cast to ObjectId failed for value "undefined" at path "_id" for model "MapResult"');
        //         });
        // });
        //
        // it('should return status 500 and no logs for chosen result', () => {
        //     const idx = randomIdx(mapResultTestDataManager.collection.length);
        //     const result = mapResultTestDataManager.collection[idx];
        //     return request(apiURL).get(`/maps/${map._id}/results/${result._id}/logs`)
        //         .expect(500)
        //         .then(({body})=> {
        //             expect.assertions(1);
        //             expect(body).toMatchObject({});
        //         })
        // });
        //
        //
        //
        it('should return status 500 and return none of the results logs assigned to the map', () => {
            return request(apiURL).get(`/maps/${map._id}/results/logs`)
                .expect(500)
                .then(({body}) => {
                    expect.assertions(1);
                    expect(body).toEqual({});
                })
        });
    // });
});
