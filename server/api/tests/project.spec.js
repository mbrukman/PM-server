const {initTestDataManager, generateProjects} = require('./factories');
const ProjectModel = require('../../api/models/project.model');
const {setupDB} = require('./helpers/test-setup');
const request = require('supertest');
const app = require('../../app');
let fixedProjects;
let mapId;


setupDB('testing');

const testDataManager = initTestDataManager(ProjectModel);

function createMap(projectId,index){
    return new Promise((resolve,reject) => {
        request(app)
        .post(`/api/maps/create`)
        .send({ name: 'beforeEach map',project:projectId })
        .then(res=> {
            testDataManager.collection[index].maps.push(res.body.id)
            mapId = res.body.id;
            return resolve()
        });
    })
}



describe('Projects e2e tests', () => {

    beforeEach(async (done) => {
        fixedProjects =  [
            {name:'project 1'}, 
            {name:'project 2'},
            {name:'project 3'},
        ]
        await testDataManager.clear(ProjectModel);
        await testDataManager.initialise(
            generateProjects,
            null,
            'name description archived maps',
            fixedProjects
        );
        done();
    })



  describe('Positive', () => {


    describe(`POST /`, () => {
      it(`should respond with a list of projects`, function (done) {
        let randomIndex = Math.floor(Math.random() * testDataManager.collection.length);  
        try{
            request(app)
            .post(`/api/projects`)
            .send({options:{}})
            .expect(200)
            .then(res => {
                expect(res.body.items.length).toEqual(testDataManager.collection.length)
                expect(res.body.totalCount).toEqual(testDataManager.collection.length)
                expect(res.body.items[randomIndex].id).toEqual(testDataManager.collection[randomIndex].id);
                done();
            }); 
        }
        catch(err){
            console.log(err.message);
            throw err;
        }
      })

      //adding some parameter to the api like page, sort and globalFilter
      it(`should respond with a list of projects`, function (done) {
        let globalFilter = fixedProjects[0].name;
        let sort = 'name';
        let page = '1';
        try{
            request(app)
            .post(`/api/projects`)
            .send({options:{sort:sort,page:page,globalFilter:globalFilter}})
            .expect(200)
            .then(res => {
                expect(res.body.items.length).toEqual(1)
                expect(res.body.totalCount).toEqual(1)
                if(res.body.items.length){
                    expect(res.body.items[0].name).toEqual(fixedProjects[0].name);
                }
                done(); 
            });
        }
        catch(err){
            console.log(err.message);
            throw err;
        }
      })
    });
   

    describe(`POST /create`, () => {
      it(`should respond with the new project`, function (done) { 
        let randomData = testDataManager.generateNewItem()
        try{
            request(app)
            .post(`/api/projects/create`)
            .send(randomData)
            .expect(200)
            .then(res => {
                testDataManager.pushToCollection(res.body)
                expect(res.body.name).toEqual(randomData.name);
                done();
            });
        }
        catch(err){
            console.log(err.message);
            throw err;
        }
      });
    });

    describe(`GET /:id/detail`, () => {
        it(`should respond with the specific project`, function (done) { 
            let projectName = fixedProjects[0].name;
            let projectId = testDataManager.getProjectIdByName(projectName)
            try{
                request(app)
                .get(`/api/projects/${projectId}/detail`)
                .expect(200)
                .then(res => {              
                    expect(res.body.name).toEqual(projectName);
                    done();
                }); 
            }
            catch(err){
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
            try{
                request(app)
                .put(`/api/projects/${projectId}/update`)
                .send({description:newDescription})
                .expect(200)
                .then(res => {   
                    testDataManager.updateCollection(projectId,res.body)           
                    expect(res.body.name).toEqual(projectName);
                    expect(res.body.description).toEqual(newDescription);
                    done();
                }); 
            }
            catch(err){
                console.log(err.message);
                throw err;
            }
        });
    });

    describe(`DELETE /:jobId/ `, () => {
        it(`should respond with 'OK'`, function (done) {
            let projectName = fixedProjects[1].name;
            let projectId = testDataManager.getProjectIdByName(projectName)
            try{
                request(app)
                .delete(`/api/projects/${projectId}/delete`)
                .expect(200)
                .then(res => {
                    testDataManager.deleteCollection(projectId)
                    expect('OK');
                    done();
                });
            }
            catch(err){
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

    describe(`GET /:projectId/add/mapId `, () => {
        it.only(`should respond with the updated project`, async function (done) {
            let projectName = fixedProjects[1].name;
            let projectId = testDataManager.getProjectIdByName(projectName);
            await createMap(projectId,testDataManager.collection.findIndex(item => item._id == projectId))
            console.log(testDataManager.collection)
            try{
                request(app) 
                .get(`/api/projects/${projectId}/add/${mapId}`)
                .expect(200)
                .then(({body}) => {
                    
                    expect(body.id).toEqual(projectId);
                    expect(body.maps.includes(mapId)).toBe(true)
                    done();
                });
            }
            catch(err){ 
                console.log(err.message);
                throw err; 
            }
        });
    });

  

  });

  describe('Negative', () => {




     });

});