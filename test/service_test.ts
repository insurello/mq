import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as t from "io-ts";
import * as sinon from "sinon";
import { service } from "../src/service";

chai.should();
chai.use(chaiAsPromised);

describe("service", () => {
  const desc = {
    type: t.any,
    init: sinon.stub().resolvesArg(0),
    authorized: sinon.stub().resolvesArg(1),
    forbidden: sinon.stub().resolvesArg(1),
    response: sinon.stub().resolvesArg(0)
  };

  const req = {
    properties: {
      headers: {
        test: "header"
      },
      replyTo: "reply-queue"
    },
    body: {},
    ack: sinon.spy(),
    nack: sinon.spy(),
    reply: sinon.spy(),
    reject: sinon.spy()
  };

  afterEach(() => {
    desc.init.resetHistory();
    desc.authorized.resetHistory();
    desc.forbidden.resetHistory();
    desc.response.resetHistory();
    req.ack.resetHistory();
    req.nack.resetHistory();
    req.reply.resetHistory();
    req.reject.resetHistory();
  });

  describe("init", () => {
    beforeEach(() => service(desc)({ test: "test" })(req));

    it("should be called", () => desc.init.called.should.equal(true));

    it("should be called with options", () =>
      desc.init.lastCall.args[0].should.deep.equal({ test: "test" }));
  });

  describe("authorized", () => {
    beforeEach(() => service(desc)({})(req));

    it("should be called", () => desc.authorized.called.should.equal(true));

    it("should be called with request headers", () =>
      desc.authorized.lastCall.args[0].should.deep.equal({ test: "header" }));

    it("should be called with context", () =>
      desc.authorized.lastCall.args[1].should.deep.equal({}));
  });

  describe("forbidden", () => {
    beforeEach(() => service(desc)({})(req));

    it("should be called", () => desc.forbidden.called.should.equal(true));

    it("should be called with request headers", () =>
      desc.forbidden.lastCall.args[0].should.deep.equal({ test: "header" }));

    it("should be called with context", () =>
      desc.forbidden.lastCall.args[1].should.deep.equal({}));
  });

  describe("response", () => {
    beforeEach(() => service(desc)({})(req));

    it("should be called", () => desc.response.called.should.equal(true));

    it("should be called with context", () =>
      desc.response.lastCall.args[0].should.deep.equal({}));

    describe("with valid response data", () => {
      beforeEach(() => service(desc)({ test: "test" })(req));
      it("should reply", () => req.reply.called.should.equal(true));
    });

    describe("with invalid response data", () => {
      beforeEach(() =>
        service({ ...desc, type: t.string })({ test: "test" })(req)
      );

      it("should nack", () => req.nack.called.should.equal(true));
    });
  });

  describe("error handling", () => {
    describe("init rejects with error", () => {
      beforeEach(() =>
        service({ ...desc, init: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("authorized rejects with error", () => {
      beforeEach(() =>
        service({ ...desc, authorized: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("forbidden rejects with error", () => {
      beforeEach(() =>
        service({ ...desc, forbidden: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });

    describe("response rejects with error", () => {
      beforeEach(() =>
        service({ ...desc, response: sinon.stub().rejects() })({})(req)
      );
      it("should nack", () => req.nack.called.should.equal(true));
    });
  });
});
