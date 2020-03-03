import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import { extractBasicLogInfo, Request } from "../src/request";

chai.should();
chai.use(chaiAsPromised);

const returnVoid = () => {
  return;
};

describe("Request", () => {
  describe("extractBasicLogInfo()", () => {
    describe("with valid data", () => {
      it("should extract basic logging information from a message", () => {
        const input: Request = {
          properties: { headers: { foo: "bar" } },
          queue: "test.queue",
          body: null,
          ack: returnVoid,
          nack: returnVoid,
          reject: returnVoid,
          reply: returnVoid
        };

        const expected = {
          message: "test",
          properties: { headers: { foo: "bar" } },
          queue: "test.queue"
        };
        return extractBasicLogInfo(input, "test").should.deep.equal(expected);
      });

      it("should filter out authorization information", () => {
        const input: Request = {
          properties: { headers: { authorization: "fghjklkjhgfghj" } },
          queue: "test.queue",
          body: null,
          ack: returnVoid,
          nack: returnVoid,
          reject: returnVoid,
          reply: returnVoid
        };

        const expected = {
          message: "test",
          properties: { headers: {} },
          queue: "test.queue"
        };
        return extractBasicLogInfo(input, "test").should.deep.equal(expected);
      });
    });
  });
});
