export interface Headers {
  [key: string]: unknown;
}

export interface Request {
  properties: {
    headers: Headers;
    type?: string;
    replyTo?: string;
  };

  body: any;
  queue?: string;
  type?: string;

  metadata?: {
    duration?: { start?: number; end?: number };
  };

  ack: () => void;
  nack: () => void;
  reject: () => void;
  reply: (data: unknown, options?: ReplyOptions) => void;
}

export interface ReplyOptions {
  more?: boolean;
  replyType?: string;
  contentType?: string;
  headers?: Headers;
}

export const extractDurationLogInfo = (
  request: Request,
  message: string,
  endTimestamp: number
) => {
  const { authorization, ...filteredHeaders } = request.properties.headers;
  const { headers, ...filteredProperties } = request.properties;
  const duration: number | undefined = request.metadata?.duration?.start
    ? endTimestamp - request.metadata.duration.start
    : undefined;

  const logInfo = {
    message,
    properties: { headers: filteredHeaders, ...filteredProperties },
    queue: request.queue
  };

  return duration ? { ...logInfo, duration } : logInfo;
};

export const initDurationTiming = (
  request: Request,
  startTimestamp: number
): void => {
  request.metadata = { duration: { start: startTimestamp } };
  return;
};
