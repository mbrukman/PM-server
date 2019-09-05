
const request = require('supertest')



const app = 'http://localhost:3000';

describe('autocomplete by model', () => {

  it('Should contain an array of objects matching the intended shape.', () => {
    return request(app)
    .get('/api/autocomplete/Map')
    .expect((response) => {
      let {body} = response;
      expect(response.statusCode).toEqual(200) 
      expect(Array.isArray(body)).toEqual(true);
      body.forEach((dataPoint) => {
        // Ensure each data point is an object with an exact set of keys.
        expect(typeof dataPoint).toEqual('object');
        expect(Object.keys(dataPoint).sort()).toEqual([
          'id',
          'value',
        ]);
        expect(typeof dataPoint.id).toEqual('string');
        expect(typeof dataPoint.value).toEqual('string');
      })
    })

  });

  it('Should contain an array of objects matching the intended shape.', () => {
    return request(app)
    .get('/api/autocomplete/Map/5d258afef976411e407505c9')
    .expect((response) => {
        let {body} = response;
        expect(response.statusCode).toEqual(200)
        expect(typeof body).toEqual('object');
        expect(Object.keys(body).sort()).toEqual([
          'id',
          'value',
        ]);
        expect(typeof body.id).toEqual('string');
        expect(typeof body.value).toEqual('string');
    })
    
  });
});




