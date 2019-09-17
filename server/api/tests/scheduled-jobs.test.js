const request = require('supertest');
const JobsModel = require("../models/scheduled-job.model");
const {TestDataManager, scheduledJobsFactory} = require('./factories');

const baseApiURL = 'http://127.0.0.1:3000/api';
const testDataManager = new TestDataManager(JobsModel);

describe('Scheduled Jobs tests', () => {

    beforeEach(async () => {
        await testDataManager.generateInitialCollection(
            scheduledJobsFactory.generateJobs()
        );
    });

    describe('Positive', () => {

        describe(`GET /`, () => {
            it(`should respond with a list of Scheduled Jobs`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                let jobId = testDataManager.collection[randomIndex].id;
                return request(baseApiURL)
                    .get(`/scheduled-jobs`)
                    .expect(200)
                    .then(res => {
                        expect(Array.isArray(res.body)).toBe(true);
                        expect(res.body[randomIndex].id).toEqual(jobId);
                    });
            })
        });

        describe(`PUT /`, () => {
            it(`should respond with an updated Scheduled Jobs`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                let job = testDataManager.collection[randomIndex];
                job.skip = true;
                return request(baseApiURL)
                    .put(`/scheduled-jobs`)
                    .send(job)
                    .expect(200)
                    .then(res => expect(res.body.id).toEqual(job.id));
            });
        });

        describe(`DELETE /:jobId/ `, () => {
            it(`should respond with 'OK'`, () => {
                const randomIndex = Math.floor(Math.random() * testDataManager.collection.length);
                let job = testDataManager.collection[randomIndex];
                return request(baseApiURL)
                    .delete(`/scheduled-jobs/${job.id}`)
                    .expect(200)
                    .then(res => expect('OK'));
            });
        });

        describe(`GET /getFutureJobs`, () => {
            it(`should respond with a list of future scheduled jobs`, () => {
                return request(baseApiURL)
                    .get(`/scheduled-jobs/getFutureJobs`)
                    .expect(200)
                    .then(res => expect(Array.isArray(res.body)).toBe(true));
            });
        });

        describe(`POST /`, () => {
            it(`should respond with a new job`, () => {
                let newJob = scheduledJobsFactory.generateSingleJob();
                return request(baseApiURL)
                    .post(`/scheduled-jobs/`)
                    .send(newJob)
                    .expect(200)
                    .then(res => expect(res.body.project).toEqual(newJob.project));
            });
        });
    });

    describe('Negative', () => {

        describe(`PUT /`, () => {
            it(`should respond with status code 500 and proper error msg`, (done) => {
                return request(baseApiURL)
                    .put(`/scheduled-jobs`)
                    .send({type: 'once', cron: 'cron'})
                    .expect(500, done)
            });
        });

        describe(`DELETE /:jobId`, () => {
            it(`should respond with status code 500 and proper error msg`, (done) => {
                return request(baseApiURL)
                    .delete(`/scheduled-jobs/0`)
                    .expect(500, done)

            });
        });

        describe(`POST /`, () => {
            it(`should respond with status code 500 and proper error msg`, (done) => {
                return request(baseApiURL)
                    .post(`/scheduled-jobs/`)
                    .send({type: 'once', cron: 'cron'})
                    .expect(500, done)
            });
        });
    });
});
