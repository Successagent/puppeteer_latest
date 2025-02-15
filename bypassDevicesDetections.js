export async function iphoneBypass(page, userAgent) {
  await page.evaluateOnNewDocument((deviceUA) => {
    // WebGL Spoofing
    WebGLRenderingContext.prototype.getParameter = (function (origFn) {
      const paramMap = {
        0x9245: "Apple Inc.",
        0x9246: "Apple GPU",
      };
      return function (parameter) {
        return paramMap[parameter] || origFn.call(this, parameter);
      };
    })(WebGLRenderingContext.prototype.getParameter);

    WebGL2RenderingContext.prototype.getParameter = (function (origFn) {
      const paramMap = {
        0x9245: "Apple Inc.",
        0x9246: "Apple GPU",
      };
      return function (parameter) {
        return paramMap[parameter] || origFn.call(this, parameter);
      };
    })(WebGL2RenderingContext.prototype.getParameter);

    // Helper function to override navigator properties safely
    const overrideProperty = (object, property, value) => {
      const descriptor = Object.getOwnPropertyDescriptor(object, property);
      if (descriptor && descriptor.configurable) {
        Object.defineProperty(object, property, { get: () => value });
      }
    };

    // Override navigator properties safely
    overrideProperty(Navigator.prototype, "platform", "iPhone");
    overrideProperty(Navigator.prototype, "vendor", "Apple Computer, Inc.");
    overrideProperty(Navigator.prototype, "userAgent", deviceUA);
  }, userAgent);
}

export async function androidBypass(page) {
  await page.evaluateOnNewDocument(() => {
    // Override WebGLRenderingContext
    const originalWebGLGetParameter =
      WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      const paramMap = {
        0x9245: "ARM", // UNMASKED_VENDOR_WEBGL
        0x9246: "Mali-G71", // UNMASKED_RENDERER_WEBGL
      };
      return (
        paramMap[parameter] || originalWebGLGetParameter.call(this, parameter)
      );
    };

    // Override WebGL2RenderingContext
    const originalWebGL2GetParameter =
      WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function (parameter) {
      const paramMap = {
        0x9245: "ARM", // UNMASKED_VENDOR_WEBGL
        0x9246: "Mali-G71", // UNMASKED_RENDERER_WEBGL
      };
      return (
        paramMap[parameter] || originalWebGL2GetParameter.call(this, parameter)
      );
    };
  });
}

export async function nuclearBypass(page, userAgent) {
  await page.setUserAgent(userAgent);

  // Advanced WebGL Spoofing
  await page.evaluateOnNewDocument(() => {
    const createContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const gl = createContext.apply(this, args);

      if (args[0] === "webgl" || args[0] === "webgl2") {
        const getParameter = gl.getParameter;
        gl.getParameter = function (p) {
          switch (p) {
            case 0x9245:
              return "ARM"; // UNMASKED_VENDOR_WEBGL
            case 0x9246:
              return "Mali-G710"; // UNMASKED_RENDERER_WEBGL
            case 0x8b49:
              return "Google Inc. (NVIDIA)"; // VENDOR
            case 0x8b4d:
              return "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)";
            default:
              return getParameter.call(gl, p);
          }
        };
      }
      return gl;
    };
  });

  // Disable automation flags
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(window, "chrome", { get: () => undefined });
    Object.defineProperty(window, "navigator", {
      get: () => ({
        ...navigator,
        permissions: {
          query: () => Promise.resolve({ state: "granted" }),
        },
      }),
    });
  });
}

export const cdpBypass = async (page) => {
  // Apply anti-detection measures to every new page
  await page.evaluateOnNewDocument(() => {
    // Bypass DevTools detection
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "devtools"
        ? Promise.resolve({ state: "denied" })
        : originalQuery(parameters);

    // Disable console monitoring
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;

    // Remove webdriver flag
    if (navigator.webdriver !== false && navigator.webdriver !== undefined) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }
  });
};
