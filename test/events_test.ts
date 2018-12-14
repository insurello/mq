import * as chai from "chai";
import * as t from "io-ts";
import * as sinon from "sinon";
import { events } from "../src/events";

chai.should();

describe("events", () => {
  const req = {
    properties: {
      headers: {}
    },
    body: {},
    ack: sinon.spy(),
    nack: sinon.spy(),
    reject: sinon.spy(),
    reply: sinon.spy()
  };

  afterEach(() => {
    req.ack.resetHistory();
    req.nack.resetHistory();
    req.reject.resetHistory();
    req.reply.resetHistory();
  });

  describe("single callback style", () => {
    const desc = {
      type: t.any,
      init: () => ({}),
      event: sinon.fake()
    };

    describe("incoming event", () => {
      beforeEach(() => events(desc)({})(req));
      it("should ack", () => req.ack.called.should.be.true);
    });

    describe("error handling", () => {
      describe("init rejects with error", () => {
        beforeEach(() =>
          events({ ...desc, init: sinon.stub().rejects() })({})(req)
        );
        it("should nack", () => req.nack.called.should.equal(true));
      });

      describe("event rejects with error", () => {
        beforeEach(() =>
          events({ ...desc, event: sinon.stub().rejects() })({})(req)
        );
        it("should nack", () => req.nack.called.should.equal(true));
      });
    });
  });

  describe("event callback style", () => {
    const desc = {
      type: t.any,
      init: () => ({}),
      events: {
        test: sinon.stub().resolves({})
      }
    };

    describe("incoming event", () => {
      beforeEach(() => events(desc)({})(req));
      it("should reject", () => req.reject.called.should.be.true);
    });

    describe("'test' event", () => {
      beforeEach(() => events(desc)({})({ ...req, body: { event: "test" } }));
      it("should ack", () => req.ack.called.should.be.true);
      it("should call 'test'", () => desc.events.test.called.should.be.true);
    });
  });
});
