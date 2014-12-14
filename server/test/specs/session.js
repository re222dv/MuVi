var expect = require('chai').expect;
var mockery = require('mockery');

describe('session service', () => {
  let Session, redisData;

  beforeEach(() => {
    redisData = {};
    let redisMock = {
      del: (key) => {
        delete redisData[key];
        return Promise.resolve();
      },
      get: (key) => Promise.resolve(redisData[key]),
      set: (key, value) => Promise.resolve(redisData[key] = value),
    };
    mockery.registerMock('../model/DAL/redis', redisMock);
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
    });

    Session = require('../../lib/services/session').default;
  });

  afterEach(mockery.disable);

  it('should create sessions with unique ids', () => {
    let session1 = Session.create();
    let session2 = Session.create();
    let session3 = Session.create();

    expect(session1.id).to.not.equal(session2.id);
    expect(session2.id).to.not.equal(session3.id);
    expect(session3.id).to.not.equal(session1.id);
  });

  it('should initialize session with an empty object', () => {
    let session = Session.create();

    expect(session.data).to.deep.equal({});
  });

  it('should be able to restore saved sessions', (done) => {
    let session = Session.create();
    let sessionId = session.id;
    let notSaved;
    session.data.userId = 5;

    Session.restore(sessionId)
      .then(session => notSaved = session)
      .then(() => session.save())
      .then(() => Session.restore(sessionId))
      .then((saved) => {
        expect(session.data).to.not.deep.equal(notSaved.data);
        expect(session.data).to.deep.equal(saved.data);
      })
      .then(done);
  });

  it('should be able to destroy sessions', (done) => {
    let session = Session.create();
    let sessionId = session.id;
    session.data.userId = 5;

    session.save()
      .then(() => session.destroy())
      .then(() => Session.restore(sessionId))
      .then((saved) => {
        expect(saved.data).to.be.undefined();
      })
      .then(done);
  });
});
