const TestDataManager = require('./factories/test-data-manager');
const request = require('supertest');
const apiURL = 'localhost:3000/api';
const AgentModel = require('../../api/models/agent.model');
const GroupModel = require('../../api/models/group.model');
const { agentFactory, groupFactory } = require('./factories');
const { randomIdx } = require('./helpers/index');


describe('Agents tests', () => {
    const agentsTestDataManager = new TestDataManager(AgentModel);
    const groupsTestDataManager = new TestDataManager(GroupModel);

    beforeEach(async () => {
        await agentsTestDataManager.generateInitialCollection(
            agentFactory.generateMany()
        );

        const agentsIds = agentsTestDataManager.collection.map(agent => {
            return agent.id
        })

        await groupsTestDataManager.generateInitialCollection(
            groupFactory.generateMany(agentsIds)
        );
    });

    afterEach(async () => {
        agentsTestDataManager.clear();
        groupsTestDataManager.clear()
    });

    describe('Positive', () => {

        describe(`GET /`, () => {
            it(`should respond with the agents`, () => {
                const randomIndex = randomIdx(agentsTestDataManager.collection.length);
                const agentId = agentsTestDataManager.collection[randomIndex].id;
                return request(apiURL)
                    .get(`/agents`)
                    .expect(200)
                    .then(({body}) => {
                        expect(body[randomIndex].id).toEqual(agentId)
                    })
                })
        });

        describe(`GET /groups`, () => {
            it(`should respond with the groups`, () => {
                const randomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[randomIndex].id;
                return request(apiURL)
                    .get(`/agents/groups`)
                    .expect(200)
                    .then(({body}) => {
                        expect(body[randomIndex].id).toEqual(groupId)
                    })
                })
        });

        describe(`POST /groups`, () => {
            it(`should respond with the groups`, () => {
                const randomIndex = randomIdx(groupsTestDataManager.collection.length);
                const {id, name} = groupsTestDataManager.collection[randomIndex];
                return request(apiURL)
                    .post(`/agents/groups`)
                    .send({name:name, _id:id})
                    .expect(200)
                    .then(({body}) => {
                        expect(body[0].id).toEqual(id)
                        expect(body[0].name).toEqual(name)
                    })
                })
        });

        describe(`PUT /groups/:id/add-agent`, () => {
            it(`should respond with the groups`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[groupRandomIndex].id;
                const agent = agentFactory.generateOne();
                return request(apiURL)
                    .put(`/agents/groups/${groupId}/add-agent`)
                    .send([agent._id])
                    .expect(200)
                    .then(({body}) => {
                        expect(body.agents[body.agents.length - 1]).toEqual(agent._id)
                    })
                })
        });

        describe(`PUT /groups/:id`, () => {
            it(`should respond with the groups`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[groupRandomIndex].id;
                const groupName = 'random group name';
                return request(apiURL)
                    .put(`/agents/groups/${groupId}`)
                    .send({name:groupName})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.name).toEqual(groupName)
                    })
                })
        });

        describe(`POST /groups/:id/add-filters`, () => {
            it(`should respond with the groups`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[groupRandomIndex].id;
                const newFilter = [
                    {
                        field: 'random field',
                        value: 'random value',
                        filterType: 'gte'
                    }
                ];
                return request(apiURL)
                    .post(`/agents/groups/${groupId}/add-filters`)
                    .send(newFilter)
                    .expect(200)
                    .then(({body}) => {
                        expect(body.filters[0]).toMatchObject(newFilter[0])
                    })
                })
        });

        describe(`POST /groups/create`, () => {
            it(`should respond with the created group`, () => {
                const newGroup = groupFactory.generateOne([]);
                return request(apiURL)
                    .post(`/agents/groups/create`)
                    .send(newGroup)
                    .expect(200)
                    .then(({body}) => {
                        expect(body.id).toEqual(newGroup._id)
                        expect(body.name).toEqual(newGroup.name);
                    })
                })
        });

        describe(`GET /groups/:id`, () => {
            it(`should respond with the specific group`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[groupRandomIndex].id;
                return request(apiURL)
                    .get(`/agents/groups/${groupId}`)
                    .expect(200)
                    .then(({body}) => {
                        expect(body.id).toEqual(groupId)
                    })
                })
        });

        describe(`DELETE /groups/:id`, () => {
            it(`should respond with the deleted group`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const groupId = groupsTestDataManager.collection[groupRandomIndex].id;
                return request(apiURL)
                    .delete(`/agents/groups/${groupId}`)
                    .expect(200)
                    .then(({text}) => {
                        expect(text).toEqual(groupId)
                    })
                })
        });

        describe(`POST /groups/:id/remove-agent`, () => {
            it(`should respond with the group`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const {id, agents} = groupsTestDataManager.collection[groupRandomIndex];
                const agent = agents[0];
                return request(apiURL)
                    .post(`/agents/groups/${id}/remove-agent`)
                    .send({agentId:agent})
                    .expect(200)
                    .then(({body}) => {
                        expect(body.id).toEqual(id)
                        expect(body.agents.includes(agent)).toEqual(false)
                    })
                })
        });

        describe(`DELETE /groups/:id/filters/:index`, () => {
            it(`should respond with the group`, () => {
                const groupRandomIndex = randomIdx(groupsTestDataManager.collection.length);
                const {id, filters} = groupsTestDataManager.collection[groupRandomIndex];
                const filterRandomIndex = randomIdx(filters.length)
                return request(apiURL)
                    .delete(`/agents/groups/${id}/filters/${filterRandomIndex}`)
                    .expect(200)
                    .then(({body}) => {
                       expect(body.id).toEqual(id);
                       expect(body.filters.length).toEqual(filters.length -1)
                    })
                })
        });

        describe(`DELETE /:id`, () => {
            it(`should respond with the OK`, () => {
                const randomIndex = randomIdx(agentsTestDataManager.collection.length);
                const agentId = agentsTestDataManager.collection[randomIndex].id;
                return request(apiURL)
                    .delete(`/agents/${agentId}`)
                    .expect(200)
                    .then(({text}) => {
                       expect(text).toEqual('OK')
                    })
                })
        });

        describe(`PUT /:id`, () => {
            it(`should respond with the updated agent`, () => {
                const randomIndex = randomIdx(agentsTestDataManager.collection.length);
                const agentId = agentsTestDataManager.collection[randomIndex].id;
                const newAgentName = 'random agent name';
                return request(apiURL)
                    .put(`/agents/${agentId}`)
                    .send({name:newAgentName})
                    .expect(200)
                    .then(({body}) => {
                       expect(body.id).toEqual(agentId);
                       expect(body.name).toEqual(newAgentName)
                    })
                })
        });
    });
    

    describe('Negative', () => {

        describe(`PUT /groups/:id/add-agent`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .put(`/agents/groups/0/add-agent`)
                    .expect(500,done)
                })
        });

        describe(`PUT /groups/:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .put(`/agents/groups/0`)
                    .expect(500,done)
                })
        });

        describe(`POST /groups/:id/add-filters`, () => {
            it(`should respond with 500 status code`, (done) => {
                const newFilter = [
                    {
                        field: 'random field',
                        value: 'random value',
                        filterType: 'gte'
                    }
                ];
                return request(apiURL)
                    .post(`/agents/groups/0/add-filters`)
                    .send(newFilter)
                    .expect(500,done)
                })
        });

        describe(`POST /groups/create`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .post(`/agents/groups/create`)
                    .expect(500,done)
                })
        });

        describe(`GET /groups/:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .get(`/agents/groups/0`)
                    .expect(500,done)
                })
        });

        describe(`DELETE /groups/:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .delete(`/agents/groups/0`)
                    .expect(500,done)
                })
        });

        describe(`POST /groups/:id/remove-agent`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .post(`/agents/groups/0/remove-agent`)
                    .expect(500,done)
                })
        });

        describe(`DELETE /groups/:id/filters/:index`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .delete(`/agents/groups/0/filters/0`)
                    .expect(500,done)
                })
        });

        describe(`DELETE /:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .delete(`/agents/0`)
                    .expect(500,done)
                })
        });

        describe(`PUT /:id`, () => {
            it(`should respond with 500 status code`, (done) => {
                return request(apiURL)
                    .put(`/agents/0`)
                    .expect(500,done)
                })
        });
    });
});
