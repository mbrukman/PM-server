const {TestDataManager, projectsFactory, mapsFactory} = require('./factories');
const ProjectModel = require('../../api/models/project.model');
const Map = require("../models/map.model");
const request = require('supertest');

const baseApiURL = 'http://127.0.0.1:3000/api';

async function createMap(projectId, index, mapName) {
    const generatedMap = mapsFactory.generateSimpleMaps(mapName);
    try {
        const map = await Map.create(generatedMap);
        await ProjectModel.findByIdAndUpdate({_id: projectId}, {$push: {maps: map.id}}, {new: true});
        testDataManager.collection[index].maps.push(map.id)
    } catch (err) {
        throw err;
    }
}

describe('Projects API tests', () => {
    let testDataManager = new TestDataManager(ProjectModel);

    beforeEach(async () => {
        await testDataManager.generateInitialCollection(
            projectsFactory.generateProjects()
        );
    });

    afterEach(async () => {
        await testDataManager.clear();
    });

    describe('Positive', () => {

        describe(`POST /`, () => {
            it(`should respond with a list of projects`, () => {
                return request(baseApiURL)
                    .post(`/projects`)
                    .send({options: {}})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.items.length).toEqual(testDataManager.collection.length);
                        expect(body.totalCount).toEqual(testDataManager.collection.length);
                    });
            });

            //adding some parameter to the api like page, sort and globalFilter
            it(`should respond with a list of projects`, () => {
                const globalFilter = testDataManager.collection[0].name;
                const filtered = testDataManager.collection.filter(project => project.name === globalFilter);
                return request(baseApiURL)
                    .post(`/projects`)
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

        describe(`POST /create`, () => {
            it(`should respond with the new project`, () => {
                const randomProject = projectsFactory.generateSingleProject();
                return request(baseApiURL)
                    .post(`/projects/create`)
                    .send(randomProject)
                    .expect(200)
                    .then(res => expect(res.body.name).toEqual(randomProject.name));
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with the specific project`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                const {id, name} = testDataManager.collection[randomIndex];
                return request(baseApiURL)
                    .get(`/projects/${id}/detail`)
                    .expect(200)
                    .then(res => expect(res.body.name).toEqual(name));
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with the updated project`, () => {
                const newDescription = 'simple description';
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                const {id, name} = testDataManager.collection[randomIndex];
                return request(baseApiURL)
                    .put(`/projects/${id}/update`)
                    .send({description: newDescription})
                    .expect(200)
                    .then(res => {
                        expect(res.body.name).toEqual(name);
                        expect(res.body.description).toEqual(newDescription);
                    });
            });
        });

        describe(`DELETE /:id/delete `, () => {
            it(`should respond with 'OK'`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                const randomProject = testDataManager.collection[randomIndex];
                // testDataManager.removeFromCollection(randomProject);
                return request(baseApiURL)
                    .delete(`/projects/${randomProject.id}/delete`)
                    .expect(200)
                    .expect('OK');
            });
        });

        //BUG (KAH -20)
        // describe(`PUT /:id/archive `, () => {
        //     it(`should respond with the archived project`, () => {

        //         const projectName = fixedProjects[1].name;
        //         const projectId = testDataManager.getProjectIdByName(projectName)
        //         try{
        //             request(baseApiURL)
        //             .put(`/projects/${projectId}/archive`)
        //             .send({isArchive:true})
        //             .expect(204)
        //             .then(res => {
        //                 testDataManager.updateCollection(projectId,res.body)
        //                 expect(res.body.name).toEqual(projectName);
        //                 expect(res.body.archived).toEqual(true);
        //
        //             });
        //         }
        //         catch(err){
        //             console.log(err.message);
        //             throw err;
        //         }
        //     });
        // });

        describe(`GET /:projectId/ `, () => {

            it(`should respond with the recent maps of the project`, async () => {
                const randomIndex = randomIdx(testDataManager.collection.length);
                const {id, name} = testDataManager.collection[randomIndex];
                const mapName = 'map 1';
                try {
                    await mapsFactory.createMap(id, randomIndex, mapName);
                    await request(baseApiURL)
                        .get(`/projects/${id}`)
                        .expect(200)
                        .then(({body}) => {
                            const data = body[0];
                            expect(data.map.name).toBe(mapName);
                            expect(data.exec).toBe(null);
                            expect(data.project.name).toBe(name);
                        });
                } catch (err) {
                    throw err;
                }
            });
        });
    });

    describe('Negative', () => {

        describe(`POST /`, () => {
            it(`should respond with a 500 status code`, (done) => {
                return request(baseApiURL)
                    .post(`/projects`)
                    .expect(500, done)
            })
        });

        describe(`POST /create`, () => {
            it(`should respond with a 500 status code`, (done) => {
                return request(baseApiURL)
                    .post(`/projects/create`)
                    .send()
                    .expect(500, done)
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with a 500 status code`, (done) => {
                return request(baseApiURL)
                    .get(`/projects/0/detail`)
                    .expect(404, done)
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with a 500 status code`, (done) => {
                const newDescription = 'simple description';
                return request(baseApiURL)
                    .put(`/projects/0/update`)
                    .send({description: newDescription})
                    .expect(500, done)
            });
        });

        describe(`DELETE /:jobId/ `, () => {
            it(`should respond with a 500 status code`, (done) => {
                return request(baseApiURL)
                    .delete(`/projects/0/delete`)
                    .expect(500, done)
            });
        });

        describe(`GET /:projectId/ `, () => {
            it(`should respond with a 500 status code`, (done) => {
                return request(baseApiURL)
                    .get(`/projects/0`)
                    .expect(500, done)
            });
        });
    })
});
