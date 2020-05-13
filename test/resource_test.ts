import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as t from "io-ts";
import * as sinon from "sinon";
import { resource } from "../src/resource";

chai.should();
chai.use(chaiAsPromised);

describe("resource", () => {
  const desc = {
    type: [t.any, t.number] as [t.Type<any>, t.Type<number>],
    init: sinon.stub().resolvesArg(0),
    authorized: sinon.stub().resolvesArg(1),
    exists: sinon.stub().resolvesArg(1),
    forbidden: sinon.stub().resolvesArg(1),
    update: sinon.stub().resolvesArg(1),
    response: sinon.stub().resolvesArg(0),
  };

  const req = {
    properties: {
      headers: {
        test: "header",
      },
      replyTo: "reply-queue",
    },
    body: { test: "test" },
    ack: sinon.spy(),
    nack: sinon.spy(),
    reply: sinon.spy(),
    reject: sinon.spy(),
  };

  afterEach(() => {
    desc.init.resetHistory();
    desc.authorized.resetHistory();
    desc.exists.resetHistory();
    desc.forbidden.resetHistory();
    desc.update.resetHistory();
    desc.response.resetHistory();
    req.ack.resetHistory();
    req.nack.resetHistory();
    req.reply.resetHistory();
    req.reject.resetHistory();
  });

  describe("init", () => {
    beforeEach(() => resource(desc)({ test: "test" })(req));

    it("should be called", () => desc.init.called.should.equal(true));

    it("should be called with options", () =>
      desc.init.lastCall.args[0].should.deep.equal({ test: "test" }));
  });

  describe("authorized", () => {
    beforeEach(() => resource(desc)({})(req));

    it("should be called", () => desc.authorized.called.should.equal(true));

    it("should be called with request headers", () =>
      desc.authorized.lastCall.args[0].should.deep.equal({ test: "header" }));

    it("should be called with context", () =>
      desc.authorized.lastCall.args[1].should.deep.equal({}));
  });

  describe("exists", () => {
    beforeEach(() => resource(desc)({})(req));

    it("should be called", () => desc.exists.called.should.equal(true));

    it("should be called with request headers", () =>
      desc.exists.lastCall.args[0].should.deep.equal({ test: "header" }));

    it("should be called with context", () =>
      desc.exists.lastCall.args[1].should.deep.equal({}));
  });

  describe("forbidden", () => {
    beforeEach(() => resource(desc)({})(req));

    it("should be called", () => desc.forbidden.called.should.equal(true));

    it("should be called with request headers", () =>
      desc.forbidden.lastCall.args[0].should.deep.equal({ test: "header" }));

    it("should be called with context", () =>
      desc.forbidden.lastCall.args[1].should.deep.equal({}));
  });

  describe("update", () => {
    beforeEach(() => resource(desc)({})(req));

    it("should be called", () => desc.update.called.should.equal(true));

    it("should be called with request body", () =>
      desc.update.lastCall.args[0].should.deep.equal({ test: "test" }));

    it("should be called with context", () =>
      desc.update.lastCall.args[1].should.deep.equal({}));

    describe("with invalid request data", () => {
      it("should nack", () => req.nack.called.should.equal(true));
    });
  });

  describe("response", () => {
    beforeEach(() => resource(desc)({})(req));

    it("should be called", () => desc.response.called.should.equal(true));

    it("should be called with context", () =>
      desc.response.lastCall.args[0].should.deep.equal({}));

    describe("with valid response data", () => {
      beforeEach(() => resource(desc)(42)(req));
      it("should reply", () => req.reply.called.should.equal(true));
    });

    describe("with invalid response data", () => {
      beforeEach(() => resource(desc)({ test: "test" })(req));

      it("should nack", () => req.nack.called.should.equal(true));
    });
  });

  describe("error handling", () => {
    describe("init rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, init: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("authorized rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, authorized: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("exists rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, exists: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("forbidden rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, forbidden: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("update rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, update: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("response rejects with error", () => {
      beforeEach(() =>
        resource({ ...desc, response: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });
  });
});
