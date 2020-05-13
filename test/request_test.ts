import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { createDurationLogInfo, Request } from "../src/request";

chai.should();
chai.use(chaiAsPromised);

const returnVoid = () => {
  return;
};

describe("Request", () => {
  describe("extractBasicLogInfo()", () => {
    describe("with valid data", () => {
      it("should extract basic logging information from a message", () => {
        const timestamp = Date.now();
        const input: Request = {
          properties: { headers: { foo: "bar" } },
          queue: "test.queue",
          body: null,
          ack: returnVoid,
          nack: returnVoid,
          reject: returnVoid,
          reply: returnVoid,
        };

        const expected = {
          message: "test",
          properties: { headers: { foo: "bar" } },
          queue: "test.queue",
          duration: 10,
        };

        return createDurationLogInfo(
          input,
          "test",
          timestamp - 10,
          timestamp
        ).should.deep.equal(expected);
      });

      it("should filter out authorization information", () => {
        const input: Request = {
          properties: { headers: { authorization: "fghjklkjhgfghj" } },
          queue: "test.queue",
          body: null,
          ack: returnVoid,
          nack: returnVoid,
          reject: returnVoid,
          reply: returnVoid,
        };

        const expected = {
          message: "test",
          properties: { headers: {} },
          queue: "test.queue",
          duration: 0,
        };
        return createDurationLogInfo(input, "test", 0, 0).should.deep.equal(
          expected
        );
      });
    });
  });
});
