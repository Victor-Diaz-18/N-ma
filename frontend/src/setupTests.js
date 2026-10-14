import "@testing-library/jest-dom";

// jsdom's test environment doesn't provide these globals, but react-router's
// internals reference them at module-load time.
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
