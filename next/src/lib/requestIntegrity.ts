import { createHmac } from "crypto";

const hmacTimestampHeader = "X-Timestamp";
const hmacSignatureHeader = "X-Signature";

export type SignableBody =
  | ArrayBuffer
  | Uint8Array
  | string
  | Buffer
  | null
  | undefined;

function normalizeBody(body: SignableBody): Buffer {
  if (body === null || body === undefined) {
    return Buffer.alloc(0);
  }
  if (typeof body === "string") {
    return Buffer.from(body);
  }
  if (body instanceof Buffer) {
    return body;
  }
  if (body instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(body));
  }
  return Buffer.from(body);
}

export function applyHmacHeaders(
  headers: Headers,
  requestPath: string,
  body: SignableBody,
  secret: string
) {
  const timestamp = Date.now().toString();
  const bodyBuffer = normalizeBody(body);
  const signature = createHmac("sha256", secret)
    .update(
      Buffer.concat([Buffer.from(requestPath), Buffer.from(timestamp), bodyBuffer])
    )
    .digest("hex");

  headers.set(hmacTimestampHeader, timestamp);
  headers.set(hmacSignatureHeader, signature);

  return { bodyBuffer, timestamp, signature };
}
