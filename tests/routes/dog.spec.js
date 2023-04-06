/* eslint-disable import/no-extraneous-dependencies */
const { expect } = require('chai');
const session = require('supertest-session');
const app = require('../../src/app.js');
const { Dog, conn } = require('../../src/db.js');

const agent = session(app);
// console.log("esto es agent",agent)
const newDog = {
  id:1,
  name: "Affenpinscher",
  height: "23 - 29",
  weight: "3 - 6",
  life_span: "10 - 12 years",
  temperament: "Stubborn, Curious, Playful, Adventurous, Active, Fun-loving",
  image: "https://cdn2.thedogapi.com/images/BJa4kxc4X.jpg"
};

describe('Videogame routes', () => {

  before(() => conn.authenticate()
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  }));
  // const agent = session(app);
  describe("GET /dogs", () => {
    beforeEach(() => Dog.sync({ force: true })
    .then(() => Dog.create(newDog)));

    describe('GET /dogs', () => {
      it('should get 200', () =>
        agent.get('/dogs').expect(200).then(function (res) {
          // console.log(res)
          expect(Array.isArray(res.body)).to.equal(true)
        })
      );
    });

    describe('GET /dogs/Affenpinscher', () => {
      it('should get 200', () =>
        agent.get('/dogs/Affenpinscher').expect(200).then(function (res) {
          // console.log( "esto es res: ",res)
          expect(res.body).to.deep.equal(newDog)
          // res.body.id.equal(1)
        })
      );
    });

  })

  describe('POST /dogs', () => {
    before(() => conn.authenticate()
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    }));
    beforeEach(async ()=> {
      await Dog.sync({ force: true })
    })
    
    it('should get 200', async () => {
    // console.log(newDog)
      await agent.post('/dogs')
      // .set("Accept", "aplication/json")
      .send(newDog)
      // .expect("content-Type", /json/)
      // .expect(200)
      .then((res) => {
        console.log("los maricos son sordons. Ok?", res.body)
        expect(res.body).to.deep.equal({
          id:"1db",
          name: "Affenpinscher",
          height: "23 - 29",
          weight: "3 - 6",
          life_span: "10 - 12 years",
          // temperament: "Stubborn, Curious, Playful, Adventurous, Active, Fun-loving",
          image: "https://cdn2.thedogapi.com/images/BJa4kxc4X.jpg"
        })
      })
    });
  });
  
});

