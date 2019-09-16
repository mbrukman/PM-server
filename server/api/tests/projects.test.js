const {TestDataManager, projectsFactory} = require('./factories');
const ProjectModel = require('../../api/models/project.model');
const {setupDB} = require('./helpers/test-setup');
const Map = require("../models/map.model");
const request = require('supertest');

const testDataManager = new TestDataManager(ProjectModel);
const baseApiURL = 'http://127.0.0.1:3000/api';

setupDB('test');

async function createMap(projectId, index, mapName) {
    const generatedMap = projectsFactory.generateSimpleMaps(mapName);
    try {
        const map = await Map.create(generatedMap);
        await ProjectModel.findByIdAndUpdate({_id: projectId}, {$push: {maps: map.id}}, {new: true});
        testDataManager.collection[index].maps.push(map.id)
    } catch (err) {
        throw err;
    }
}

describe('Projects e2e tests', () => {
    beforeEach(async () => {
        await testDataManager.generateInitialCollection(
            projectsFactory.generateProjects()
        );
    });

    describe('Positive', () => {

        describe(`POST /`, () => {
            it(`should respond with a list of projects`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);

                return request(baseApiURL)
                    .post(`/projects`)
                    .send({options: {}})
                    .expect(200)
                    .then(res => {
                        expect(res.body.items.length).toEqual(testDataManager.collection.length);
                        expect(res.body.totalCount).toEqual(testDataManager.collection.length);
                        expect(res.body.items[randomIndex].id).toEqual(testDataManager.collection[randomIndex].id);
                    });
            });

            //adding some parameter to the api like page, sort and globalFilter
            it(`should respond with a list of projects`, () => {
                const globalFilter = testDataManager.collection[0].name;
                return request(baseApiURL)
                    .post(`/projects`)
                    .send({options: {sort: 'name', page: 1, globalFilter}})
                    .expect(200)
                    .then(res => {
                        expect(res.body.items.length).toEqual(1);
                        expect(res.body.totalCount).toEqual(1);
                        if (res.body.items.length) {
                            expect(res.body.items[0].name).toEqual(globalFilter);
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
                    .then(res => {
                        testDataManager.pushToCollection(res.body)
                        expect(res.body.name).toEqual(randomProject.name);
                    });
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with the specific project`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                const {id, name} = testDataManager.collection[randomIndex];
                return request(baseApiURL)
                    .get(`/projects/${id}/detail`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.name).toEqual(name);
                    });
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
                testDataManager.removeFromCollection(randomProject)
                return request(baseApiURL)
                    .delete(`/projects/${randomProject.id}/delete`)
                    .expect(200)
                    .then(res => {
                        expect('OK');
                    });
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

            it(`should respond with the recents map s of the project`, async () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                const {id, name} = testDataManager.collection[randomIndex];
                const mapName = 'map 1';
                try {
                    await createMap(id, randomIndex, mapName)
                    return request(baseApiURL)
                        .get(`/projects/${id}`)
                        .expect(200)
                        .then(({body}) => {
                            const data = body[0];
                            expect(data.map.name).toBe(mapName);
                            expect(data.exec).toBe(null);
                            expect(data.project.name).toBe(name)
                        });
                } catch (err) {
                    throw err;
                }
            });
        });
    });

    describe('Negative', () => {

        describe(`POST /`, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                return request(baseApiURL)
                    .post(`/projects`)
                    .expect(500, done)
            })
        });

        describe(`POST /create`, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                return request(baseApiURL)
                    .post(`/projects/create`)
                    .send({})
                    .expect(500, done)
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                return request(baseApiURL)
                    .get(`/projects/0/detail`)
                    .expect(404, done)
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                const newDescription = 'simple description';
                return request(baseApiURL)
                    .put(`/projects/0/update`)
                    .send({description: newDescription})
                    .expect(500, done)
            });
        });

        describe(`DELETE /:jobId/ `, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                return request(baseApiURL)
                    .delete(`/projects/0/delete`)
                    .expect(500, done)
            });
        });

        describe(`GET /:projectId/ `, () => {
            it(`should respond with a 500 proper msg`, (done) => {
                return request(baseApiURL)
                    .get(`/projects/0`)
                    .expect(500, done)
            });
        });
    })
});
