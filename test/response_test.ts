import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import { response } from "../src/response";

chai.should();
chai.use(chaiAsPromised);

describe("response", () => {
  describe("response()", () => {
    const req = {
      properties: {
        headers: {},
        replyTo: "reply-queue",
      },
      body: {},
      ack: sinon.spy(),
      nack: sinon.spy(),
      reply: sinon.spy(),
      reject: sinon.spy(),
    };

    afterEach(() => {
      req.ack.resetHistory();
      req.nack.resetHistory();
      req.reply.resetHistory();
      req.reject.resetHistory();
    });

    describe("with a reply-to queue, response body, and headers", () => {
      beforeEach(() => response(req)({ test: "test" }, { header: "test" }));

      it("should reply", () => req.reply.called.should.equal(true));

      it("should reply with response body", () =>
        req.reply.lastCall.args[0].should.deep.equal({ test: "test" }));

      it("should reply with headers", () =>
        req.reply.lastCall.args[1].should.deep.include({
          headers: { header: "test" },
        }));

      it("should reply with application/json as content type", () =>
        req.reply.lastCall.args[1].should.deep.include({
          contentType: "application/json",
        }));
    });

    describe("without a reply-to queue", () => {
      beforeEach(() =>
        response({ ...req, properties: { replyTo: undefined, headers: {} } })(
          { test: "test" },
          { header: "test" }
        )
      );

      it("should ack", () => req.ack.called.should.equal(true));
    });

    describe("without a response body", () => {
      beforeEach(() => response(req)(undefined, { header: "test" }));

      it("should ack", () => req.ack.called.should.equal(true));
    });

    describe("without headers", () => {
      beforeEach(() => response(req)({ test: "test" }, undefined));

      it("should not send headers", () =>
        req.reply.lastCall.args[1].should.include({ headers: undefined }));
    });
  });
});
