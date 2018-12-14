import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as t from "io-ts";
import { decode } from "../src/decoder";

chai.should();
chai.use(chaiAsPromised);

describe("decoder", () => {
  describe("decode()", () => {
    describe("with valid data", () => {
      it("should resolve with the data", () =>
        decode(t.string, "hello").should.eventually.equal("hello"));
    });

    describe("with invalid data", () => {
      it("should reject with an error", () =>
        decode(t.string, 42).should.be.rejectedWith(
          Error,
          "Expecting string but instead got: 42."
        ));

      it("should specify which key in an object is invalid", () =>
        decode(t.type({ test: t.string }), { test: 42 }).should.be.rejectedWith(
          Error,
          "Expecting string at test but instead got: 42."
        ));

      it("should separate multiple errors with newlines", () =>
        decode(
          t.type({ foo: t.string, bar: t.number }),
          {}
        ).should.be.rejectedWith(
          Error,
          "Expecting string at foo but instead got: undefined.\n" +
            "Expecting number at bar but instead got: undefined."
        ));
    });
  });
});
