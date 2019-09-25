const request = require('supertest');
// models to test in autocomplete: Project, Map, Vault
const { Project, Map, Vault } = require('../../api/models');
const { TestDataManager, projectsFactory, mapsFactory, vaultsFactory } = require(`./factories`);

//router.get("/:modelName", autoCompleteController.generateAutoComplete);
//router.get("/:modelName/:key", autoCompleteController.getValueByKey);
const app = 'localhost:3000';

describe('Autocomplete tests', () => {

    const projectDataManager = new TestDataManager(Project);

    beforeEach(async () => {
        let projects = projectsFactory.generateProjects();
        projects = projects.map(p => {
            p.name = 'test project';
            return p;
        });
        await projectDataManager.generateInitialCollection(projects);
    });

    describe('Positive', () => {
        describe('Project model', () => {
            it(`should return autocomplete`, () => {
                return request(app)
                    .get(`/api/autocomplete/Project?query=test`)
                    .expect(200)
                    .then(res => {
                        expect(Array.isArray(res.body)).toBe(true);
                        expect(res.body.length > 0).toBe(true);
                        expect(res.body.length <= 5).toBe(true);
                    })
            });

            it(`should return value for given key`, async () => {
                const project = await Project.findOne({ name: 'test project' });
                return request(app)
                    .get(`/api/autocomplete/Project/${project.id}`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.id).toBe(project.id);
                        expect(res.body.value).toBe('test project');
                    })
            });

        });
        /*
        describe('Map model', () => { });

        describe('Vault model', () => { });
        */
    });

    describe('Negative', () => {
        it(`should respond with status 500 on invalid model name`, () => {
            const invalidModelName = 'invalid-model-name';
            return request(app)
                .get(`/api/autocomplete/${invalidModelName}`)
                .expect(500);
        });

        it(`should respond with status 500 on invalid model name and invalid key`, () => {
            const invalidModelName = 'invalid-model-name';
            return request(app)
                .get(`/api/autocomplete/${invalidModelName}/test-key`)
                .expect(500);
        });

        it(`should respond with status 500 on invalid key`, () => {
            return request(app)
                .get(`/api/autocomplete/Map/test-key`)
                .expect(500);
        });
    });
});