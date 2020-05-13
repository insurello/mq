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

describe("with an instance of `Error` with .nackDelayMs", () => {
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

  it("should nack after the given delay", async () => {
    const clock = sinon.useFakeTimers();
    const error = new Error("test");
    (error as any).nackDelayMs = 5000;
    errorHandler(req, logger, 0)();
    await clock.tickAsync(4000);
    req.nack.called.should.equal(false);
    await clock.tickAsync(1000);
    req.nack.called.should.equal(true);
    clock.restore();
  });

  afterEach(() => {
    req.ack.resetHistory();
    req.nack.resetHistory();
    req.reply.resetHistory();
    req.reject.resetHistory();
    (logger.error as sinon.SinonStub).resetHistory();
    (logger.warn as sinon.SinonStub).resetHistory();
  });
});
