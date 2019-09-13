const {TestDataManager, projectsFactory} = require('./factories');
const ProjectModel = require('../../api/models/project.model');
const {setupDB} = require('./helpers/test-setup');
const request = require('supertest');

setupDB('test');

const testDataManager = new TestDataManager(ProjectModel);
const baseApiURL = 'http://127.0.0.1:3000/api';

function createMap(projectId, index, mapName) {
    return request(baseApiURL)
        .post(`/api/maps/create`)
        .send({name: mapName, project: projectId})
        .then(res => {
            testDataManager.collection[index].maps.push(res.body.id);
        });
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
            it(`should respond with the new project`, function (done) {
                let randomData = testDataManager.generateNewItem()
                try {
                    request(app)
                        .post(`/api/projects/create`)
                        .send(randomData)
                        .expect(200)
                        .then(res => {
                            testDataManager.pushToCollection(res.body)
                            expect(res.body.name).toEqual(randomData.name);
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with the specific project`, function (done) {
                let projectName = fixedProjects[0].name;
                let projectId = testDataManager.getProjectIdByName(projectName)
                try {
                    request(app)
                        .get(`/api/projects/${projectId}/detail`)
                        .expect(200)
                        .then(res => {
                            expect(res.body.name).toEqual(projectName);
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with the updated project`, function (done) {
                let newDescription = 'simple description';
                let projectName = fixedProjects[0].name;
                let projectId = testDataManager.getProjectIdByName(projectName)
                try {
                    request(app)
                        .put(`/api/projects/${projectId}/update`)
                        .send({description: newDescription})
                        .expect(200)
                        .then(res => {
                            testDataManager.updateCollection(projectId, res.body)
                            expect(res.body.name).toEqual(projectName);
                            expect(res.body.description).toEqual(newDescription);
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`DELETE /:jobId/ `, () => {
            it(`should respond with 'OK'`, function (done) {
                let projectName = fixedProjects[1].name;
                let projectId = testDataManager.getProjectIdByName(projectName)
                try {
                    request(app)
                        .delete(`/api/projects/${projectId}/delete`)
                        .expect(200)
                        .then(res => {
                            testDataManager.deleteCollection(projectId)
                            expect('OK');
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });


        //BUG (KAH -20)
        // describe(`PUT /:id/archive `, () => {
        //     it(`should respond with the archived project`, function (done) {

        //         let projectName = fixedProjects[1].name;
        //         let projectId = testDataManager.getProjectIdByName(projectName)
        //         try{
        //             request(app)
        //             .put(`/api/projects/${projectId}/archive`)
        //             .send({isArchive:true})
        //             .expect(204)
        //             .then(res => {
        //                 testDataManager.updateCollection(projectId,res.body)
        //                 expect(res.body.name).toEqual(projectName);
        //                 expect(res.body.archived).toEqual(true);
        //                 done();
        //             });
        //         }
        //         catch(err){
        //             console.log(err.message);
        //             throw err;
        //         }
        //     });
        // });


        describe(`GET /:projectId/ `, () => {

            it(`should respond with the recents maps of the project`, async function (done) {
                let projectName = fixedProjects[1].name;
                let projectId = testDataManager.getProjectIdByName(projectName)
                let mapName = 'map 1'
                await createMap(projectId, testDataManager.collection.findIndex(item => item._id == projectId), mapName)
                try {
                    request(app)
                        .get(`/api/projects/${projectId}`)
                        .expect(200)
                        .then(({body}) => {
                            let data = body[0];
                            expect(data.map.name).toBe(mapName);
                            expect(data.exec).toBe(null);
                            expect(data.project.name).toBe(projectName)
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });


    });

    describe('Negative', () => {

        describe(`POST /`, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                try {
                    request(app)
                        .post(`/api/projects`)
                        .expect(500)
                        .then(res => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            })
        });

        describe(`POST /create`, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                try {
                    request(app)
                        .post(`/api/projects/create`)
                        .send({})
                        .expect(500)
                        .then(res => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`GET /:id/detail`, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                try {
                    request(app)
                        .get(`/api/projects/0/detail`)
                        .expect(404)
                        .then(res => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`PUT /:id/update`, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                let newDescription = 'simple description';
                try {
                    request(app)
                        .put(`/api/projects/0/update`)
                        .send({description: newDescription})
                        .expect(500)
                        .then(res => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`DELETE /:jobId/ `, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                try {
                    request(app)
                        .delete(`/api/projects/0/delete`)
                        .expect(500)
                        .then(res => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });

        describe(`GET /:projectId/ `, () => {
            it(`should respond with a 500 proper msg`, function (done) {
                try {
                    request(app)
                        .get(`/api/projects/0`)
                        .expect(500)
                        .then(() => {
                            done();
                        });
                } catch (err) {
                    console.log(err.message);
                    throw err;
                }
            });
        });


    })
})
