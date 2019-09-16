const {randomIdx} = require("./helpers");

const request = require('supertest');
const {setupDB} = require('./helpers/test-setup');
const ProjectModel = require('../../api/models/project.model');
const MapStructureModel = require('../../api/models/map-structure.model');
const {mapStructureFactory, mapsFactory, projectsFactory, processFactory} = require('./factories');
const TestDataManager = require('./factories/test-data-manager');

const apiURL = 'localhost:3000/api';

setupDB();

describe('Map revision endpoints should work correctly', () => {
    const mapStructureTestDataManager = new TestDataManager(MapStructureModel);
    const projectTestDataManager = new TestDataManager(ProjectModel);
    let map;
    let project;

    beforeEach(async () => {
        await projectTestDataManager.generateInitialCollection(
            projectsFactory.generateProjects()
        );

        const randomIndex = randomIdx(projectTestDataManager.collection.length);
        project = projectTestDataManager.collection[randomIndex];

        map = await mapsFactory.createMap(project.id, project.name, 'random map name');
        await mapStructureTestDataManager.generateInitialCollection(
            mapStructureFactory.generateMany(map._id.toString(), [map])
        );
    });

    afterEach(async () => {
        await mapStructureTestDataManager.clear();
        await projectTestDataManager.clear();
        map = null;
    });

    describe('/GET works correctly', () => {

        it('should return 200 and single structure', () => {
            return request(apiURL)
                .get(`/maps/${map._id}/structure`)
                .expect(200)
                .then(({body}) => {
                    expect.assertions(1);
                    expect(body.map).toBe(map._id.toString());
                })
        });

        it('should return 200 and all structures in the system', () => {
            return request(apiURL)
                .get(`/maps/${map._id}/structures`)
                .expect(200)
                .then(({body}) => {
                    expect.assertions(1);
                    expect(body.length).toBe(mapStructureTestDataManager.collection.length);
                })
        });

        it('should return 200 and single structure chosen by passed id', () => {
            const structure = mapStructureTestDataManager.collection[0];
            return request(apiURL)
                .get(`/maps/${map._id}/structure/${structure._id}`)
                .expect(200)
                .then(({body}) => {
                    expect.assertions(2);
                    expect(body._id).toBe(structure._id.toString());
                    expect(body.code).toBe(structure.code);
                })
        });
    });
    describe('/POST works correctly', () => {

        it('should create a structure and return 200', () => {
            const structure = mapStructureFactory.generateOne(map._id, [map]);
            structure.processes = processFactory.generateMany([]);
            return request(apiURL)
                .post(`/maps/${map._id}/structure/create`)
                .send({structure})
                .expect(200)
                .then(({body}) => {
                    expect.assertions(2);
                    expect(body._id).toBe(structure._id.toString());
                    expect(body.code).toBe(structure.code);
                })
        });
        it('should create a duplicate of a map with given name and return 200', () => {
            const structure = mapStructureTestDataManager.collection[0];
            const name = 'a new name of a map';
            return request(apiURL)
                .post(`/maps/${map._id}/structure/${structure._id}/duplicate`)
                .send({
                    options: Object.assign( {
                        name
                    }),
                    projectId: project.id
                })
                .expect(200)
                .then(({body}) => {
                    expect.assertions(1);
                    expect(body.name).toBe(name);
                })
        })
    })
});
