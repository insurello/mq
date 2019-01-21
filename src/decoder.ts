import * as t from "io-ts";
import { reporter } from "io-ts-reporters";

export const decode = <A, O>(
  decoder: t.Type<A, O>,
  data: unknown
): Promise<A> => {
  const result = decoder.decode(data);
  if (result.isRight()) {
    return Promise.resolve(result.value);
  } else {
    const error = reporter(result).join("\n");
    return Promise.reject(new Error(error));
  }
};
