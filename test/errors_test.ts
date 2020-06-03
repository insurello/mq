import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import { errorHandler } from "../src/errors";
import { logger } from "../src/logger";

chai.should();
chai.use(chaiAsPromised);

sinon.stub(logger, "error");
sinon.stub(logger, "warn");
sinon.stub(logger, "verbose");

const delay = (sleepMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, sleepMs));

describe("errors", () => {
  describe("errorHandler()", () => {
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
      (logger.error as sinon.SinonStub).resetHistory();
      (logger.warn as sinon.SinonStub).resetHistory();
    });

    describe("with an instance of `Error`", () => {
      beforeEach(() =>
        errorHandler({
          req,
          logger,
          startTimestamp: Date.now(),
          defaultNackDelayMs: 0,
        })(new Error("test"))
      );

      it("should nack the request", () => req.nack.called.should.equal(true));

      it("should log an error message", () =>
        (logger.error as sinon.SinonStub).called.should.equal(true));
    });

    describe("with an instance of `Error` with .nackDelayMs", () => {
      it("should nack after the given delay", async () => {
        const error = new Error("test");
        (error as any).nackDelayMs = 50;
        const errorPromise = errorHandler({
          req,
          logger,
          startTimestamp: Date.now(),
          defaultNackDelayMs: 0,
        })(error);
        await delay(40);
        req.nack.called.should.equal(false);
        await delay(10);
        req.nack.called.should.equal(true);
        await errorPromise;
      });
    });

    describe("with an error object", () => {
      beforeEach(() =>
        errorHandler({
          req,
          logger,
          startTimestamp: Date.now(),
          defaultNackDelayMs: 0,
        })({
          error: "test",
          error_description: "Test",
        })
      );

      it("should reply", () => req.reply.called.should.equal(true));

      it("should reply with an error in the body", () =>
        req.reply.lastCall.args[0].should.deep.equal({
          error: "test",
          error_description: "Test",
        }));

      it("should reply with the `x-error` header set", () =>
        req.reply.lastCall.args[1].should.deep.include({
          headers: {
            "x-error": "test",
          },
        }));

      it("should log a warning message", () =>
        (logger.warn as sinon.SinonStub).called.should.equal(true));
    });

    describe("with a string", () => {
      beforeEach(() =>
        errorHandler({
          req,
          logger,
          startTimestamp: Date.now(),
          defaultNackDelayMs: 0,
        })("test")
      );

      it("should reply", () => req.reply.called.should.equal(true));

      it("should reply with an error in the body", () =>
        req.reply.lastCall.args[0].should.deep.equal({
          error: "test",
        }));

      it("should reply with the `x-error` header set", () =>
        req.reply.lastCall.args[1].should.deep.include({
          headers: {
            "x-error": "test",
          },
        }));

      it("should log a warning message", () =>
        (logger.warn as sinon.SinonStub).called.should.equal(true));
    });

    describe("with undefined instead of an error", () => {
      beforeEach(() =>
        errorHandler({
          req,
          logger,
          startTimestamp: Date.now(),
          defaultNackDelayMs: 0,
        })(undefined)
      );

      it("should reject the request", () =>
        req.reject.called.should.equal(true));

      it("should log a verbose message", () =>
        (logger.verbose as sinon.SinonStub).called.should.equal(true));
    });
  });
});
