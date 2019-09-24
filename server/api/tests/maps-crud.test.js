const {randomIdx} = require("./helpers");
const request = require('supertest');
const MapModel = require('../../api/models/map.model');
const { MapResult } = require('../models/map-results.model');
const TestDataManager = require('./factories/test-data-manager');
const apiURL = 'localhost:3000/api';
const {orderBy} = require('lodash');
const ProjectModel = require('../../api/models/project.model');
const {MapStructure} = require('../../api/models/map-structure.model');
const AgentModel = require('../../api/models/agent.model');
const {
    mapResultFactory,
    mapStructureFactory,
    mapsFactory,
    projectsFactory,
    agentFactory,
} = require('./factories');
let project;

describe('Map crud tests', () => {
    const mapTestDataManager = new TestDataManager(MapModel);
    const projectTestDataManager = new TestDataManager(ProjectModel);
    const mapResultTestDataManager = new TestDataManager(MapResult);
    const agentsTestDataManager = new TestDataManager(AgentModel);
    const mapStructureTestDataManager = new TestDataManager(MapStructure);
    jest.setTimeout(15000);

    beforeEach(async () => {
        await projectTestDataManager.generateInitialCollection(
            projectsFactory.generateProjects()
        );

        await mapTestDataManager.generateInitialCollection(
            mapsFactory.generateMany()
        );

        let randomIndex = randomIdx(projectTestDataManager.collection.length);
        project = projectTestDataManager.collection[randomIndex];

        for(let map of mapTestDataManager.collection){
            await mapsFactory.addMapToProject(project.id,map._id)
        }

        const agent = await agentsTestDataManager.pushToCollectionAndSave(
            agentFactory.generateOne()
        );
        randomIndex = randomIdx(mapTestDataManager.collection.length);
        let map = mapTestDataManager.collection[randomIndex];
        await mapStructureTestDataManager.generateInitialCollection((
            mapStructureFactory.generateMany(map._id.toString(), [map])
        ));
        const mapStructure = mapStructureTestDataManager.collection[0];
        const process = mapStructure.processes[0];
        const actionId = process.actions[0]._id.toString();
        const processId = process._id.toString();
        await mapResultTestDataManager.generateInitialCollection(
            [mapResultFactory.generateOne({
                    agentId: agent._id.toString(),
                    mapStructureId: mapStructure._id.toString(),
                    mapId: map._id.toString(),
                    processId,
                    actionId,
                }
            )]
        );
        mapResultTestDataManager.collection = orderBy(mapResultTestDataManager.collection, ['startTime'],['desc']);
    });

    afterEach(async () => {
        await mapTestDataManager.clear();
        await projectTestDataManager.clear();
        await mapResultTestDataManager.clear();
    });

    describe('Positive', () => {

        describe(`POST /`, () => {
            it(`should respond with a list of maps`, () => {
                return request(apiURL)
                    .post(`/maps`)
                    .send({options: {}})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.items.length).toEqual(mapTestDataManager.collection.length);
                        expect(body.totalCount).toEqual(mapTestDataManager.collection.length);
                    });
            });

            //adding some parameter to the api like page, sort and globalFilter
            it(`should respond with a list of maps`, () => {
                const globalFilter = mapTestDataManager.collection[0].name;
                const filtered = mapTestDataManager.collection.filter(map => map.name === globalFilter);
                return request(apiURL)
                    .post(`/maps`)
                    .send({options: {sort: 'name', page: 1, globalFilter}})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.items.length).toEqual(filtered.length);
                        expect(body.totalCount).toEqual(filtered.length);
                        if (body.items.length) {
                            expect(body.items[0].name).toEqual(globalFilter);
                        }
                    });
            })
        });

        describe(`POST /:create`, () => {
            it(`should respond with the created map`, () => {
                const randomMap = mapsFactory.generateSimpleMap();
                const randomIndex = randomIdx(projectTestDataManager.collection.length)
                let projectId = projectTestDataManager.collection[randomIndex].id;
                randomMap.project = projectId
                return request(apiURL)
                    .post(`/maps/create`)
                    .send(randomMap)
                    .expect(200)
                    .then(res => expect(res.body.name).toEqual(randomMap.name));
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with OK message`, () => {
                let mapName = 'map';
                const randomIndex = randomIdx(mapTestDataManager.collection.length)
                let randomMap = mapTestDataManager.collection[randomIndex];
                randomMap.name = mapName;
                return request(apiURL)
                    .put(`/maps/${randomMap.id}/update`)
                    .send(randomMap)
                    .expect(200)
                    .then(res => expect(res.text).toEqual('OK'));
            });
        });

        describe(`PUT /:id/archive`, () => {
            it(`should respond with 204 status code`, () => {
                const randomIndex = randomIdx(mapTestDataManager.collection.length)
                let mapId = mapTestDataManager.collection[randomIndex].id;
                return request(apiURL)
                    .put(`/maps/${mapId}/archive`)
                    .send({isArchive:true})
                    .expect(204)
            });
        });

        describe(`GET /results`, () => {
            it(`should respond with recents maps`, () => {
                const randomIndex = randomIdx(mapResultTestDataManager.collection.length);
                let mapId = mapResultTestDataManager.collection[randomIndex].map.toString();
                let executionId = mapResultTestDataManager.collection[randomIndex]._id.toString();
                return request(apiURL)
                    .get(`/maps/results`)
                    .expect(200)
                    .then(({body}) => {
                        expect(body.length).toBeLessThanOrEqual(16);
                        expect(body[randomIndex].map._id).toEqual(mapId);
                        expect(body[randomIndex]._id).toEqual(mapId);
                        expect(body[randomIndex].exec._id).toEqual(executionId);
                        expect(body[0].project._id).toEqual(project._id.toString());
                        expect(body[0].project.name).toEqual(project.name);
                    })
            });
        });

        describe(`GET /recent`, () => {

            it(`should respond with recents maps`, () => {
                return request(apiURL)
                    .get(`/maps/recent`)
                    .expect(200)
                    .then(({body}) => {
                        const randomIndex = randomIdx(body.length);
                        expect(body.length).toBeLessThanOrEqual(4);
                        expect(body[randomIndex].map._id).toEqual(mapResultTestDataManager.collection[randomIndex].map.toString());
                        expect(body[randomIndex]._id).toEqual(mapResultTestDataManager.collection[randomIndex].map.toString());
                        expect(body[0].project._id).toEqual(project._id.toString());
                        expect(body[0].project.name).toEqual(project.name);
                    })
            });
        });

        describe(`DELETE /:id`, () => {
            it(`should respond with 200 status code`, () => {
                const randomIndex = randomIdx(mapTestDataManager.collection.length);
                const deletedMap = mapTestDataManager.collection[randomIndex];
                return request(apiURL)
                    .delete(`/maps/${deletedMap._id}`)
                    .expect(200)
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with the specific map`, () => {
                const randomIndex = randomIdx(mapTestDataManager.collection.length);
                const randomMap = mapTestDataManager.collection[randomIndex];
                return request(apiURL)
                    .get(`/maps/${randomMap._id}`)
                    .expect(200)
                    .then(res => expect(res.body.id).toEqual(randomMap._id.toString()))
            });
        });

    });

    describe('Negative', () => {

        describe(`POST /`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .post(`/maps`)
                    .expect(500,done)
            });
        });

        describe(`POST /:create`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .post(`/maps/create`)
                    .expect(400,done)
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with 500 status code`, (done) => {;
                return request(apiURL)
                    .put(`/maps/0/update`)
                    .expect(500,done)
            });
        });

        describe(`PUT /:id/archive`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .put(`/maps/0/archive`)
                    .send({isArchive:true})
                    .expect(500,done)
            });
        });

        describe(`DELETE /:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .delete(`/maps/0`)
                    .expect(500,done)
            });
        });

        describe(`GET /:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .get(`/maps/0`)
                    .expect(500,done)
            });
        });

    });
});
