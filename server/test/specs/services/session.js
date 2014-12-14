let expect = require('chai').expect;
let mockery = require('mockery');
import {redisData, mockRedis} from '../../mocks/redis';

describe('session service', () => {
  let Session;

  beforeEach(() => {
    mockRedis();
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
    });

    Session = require('../../../lib/services/session').default;
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

  it('should save sessions with a "session-" prefix', () => {
    let session = Session.create();
    return session.save()
      .then(() => {
        expect(redisData[`session-${session.id}`]).to.not.be.undefined();
      });
  });

  it('should be able to restore saved sessions', () => {
    let session = Session.create();
    let sessionId = session.id;
    let notSaved;
    session.data.userId = 5;

    return Session.restore(sessionId)
      .then(session => notSaved = session)
      .then(() => session.save())
      .then(() => Session.restore(sessionId))
      .then((saved) => {
        expect(session.data).to.not.deep.equal(notSaved.data);
        expect(session.data).to.deep.equal(saved.data);
      });
  });

  it('should be able to destroy sessions', () => {
    let session = Session.create();
    let sessionId = session.id;
    session.data.userId = 5;

    return session.save()
      .then(() => session.destroy())
      .then(() => Session.restore(sessionId))
      .then((saved) => {
        expect(session.isDestroyed).to.be.true();
        expect(saved.data).to.be.undefined();
      });
  });
});
