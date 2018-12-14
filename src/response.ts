import { Headers, Request } from "./request";

export const response = (req: Request) => <T>(data: T, headers?: Headers) => {
  if (req.properties.replyTo && data) {
    req.reply(data, { contentType: "application/json", headers });
  } else {
    req.ack();
  }
};
