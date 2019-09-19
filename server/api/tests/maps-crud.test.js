const {randomIdx} = require("./helpers");
const request = require('supertest');
const {setupDB} = require('./helpers/test-setup');
const MapModel = require('../../api/models/map.model');
const ProjectModel = require('../models/project.model')
const {mapsFactory,projectsFactory} = require('./factories');
const TestDataManager = require('./factories/test-data-manager');
const apiURL = 'localhost:3000/api';

setupDB();

describe('Map crud tests', () => {
    const mapTestDataManager = new TestDataManager(MapModel);
    const projectTestDataManager = new TestDataManager(ProjectModel);

    beforeEach(async () => {
        await projectTestDataManager.generateInitialCollection(
            [projectsFactory.generateSingleProject()]
        );
        const randomIndex = randomIdx(projectTestDataManager.collection.length);
        project = projectTestDataManager.collection[randomIndex];
        await mapTestDataManager.generateInitialCollection(
            mapsFactory.generateMany()
        );
        for(let map of mapTestDataManager.collection){
            await mapsFactory.createMap(project.id,map)
        }

    });

    afterEach(async () => {
        await mapTestDataManager.clear();
        await projectTestDataManager.clear();
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
                const randomMap = mapsFactory.generateSimpleMaps();
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

        
    });

    // describe('Negative', () => {

    //     describe(`GET /:mapId`, () => {
    //         // it(`should respond with status code 500 and proper error msg`, function (done) {
               
    //         // });
    //     });

       
    // });
});
