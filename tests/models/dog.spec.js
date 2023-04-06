const { Dog, conn } = require('../../src/db.js');
const { expect } = require('chai');

describe('Dog model', () => {
  before(() => conn.authenticate()
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    }));
  describe('Validators', () => {
    beforeEach(() => Dog.sync({ force: true }));
    describe('name', () => {
      // it('should throw an error if name is null', (done) => {
      //   Dog.create({})
      //     .then(() => done(new Error('It requires a valid name')))
      //     .catch(() => done());
      // });
      it('should throw an error if name is null', async () => {
        const newDog = await Dog.create({id: "5", height: "50", weight: "10"})
          // .catch(() => new Error('It requires a valid name'));
          .catch((error) => error.message);
        expect(newDog).to.equal('notNull Violation: dog.name cannot be null')
      });
      it('should throw an error if height is null', async () => {
        const newDog = await Dog.create({id: "5", name: "Bulldog", weight: "10"})
        // .catch(() => new Error('It requires a valid name'));
        .catch((error) => error.message);
        expect(newDog).to.equal('notNull Violation: dog.height cannot be null')
      });
      it('should throw an error if weight is null', async () => {
        const newDog = await Dog.create({id: "5", name: "Bulldog", height: "10"})
        // .catch(() => new Error('It requires a valid name'));
        .catch((error) => error.message);
        expect(newDog).to.equal('notNull Violation: dog.weight cannot be null')
      });
      // it('should work when its a valid name', () => {
      //   Dog.create({ name: 'Pug' });
      // });

      // it('should work when its a valid name', () => {
      //   Dog.create({ name: 'Pug' })
      //     .then(() => done);
      // });

      it('should work when its a valid name', async () => {
        const newDog = await Dog.create({ id:5 , name: 'Pug', height: "60", weight: "50"});
        // console.log(newDog)
        // expect(newDog).to.equal("text")
      });
    });
  });
});
