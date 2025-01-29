async function iphoneBypass(page, userAgent) {
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

    // Navigator Spoofing
    const modifyNavigator = (originalNavigator, device) => {
      const override = {
        plugins: originalNavigator.plugins,
        platform: "iPhone",
        vendor: "Apple Computer, Inc.",
        userAgent: device,
      };

      const handler = {
        get: function (target, prop) {
          if (override.hasOwnProperty(prop)) {
            return override[prop];
          }
          return Reflect.get(target, prop);
        },
      };

      const proxyNavigator = new Proxy(originalNavigator, handler);
      Object.defineProperty(globalThis, "navigator", {
        value: proxyNavigator,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    };

    modifyNavigator(navigator, deviceUA);
  }, userAgent);
}

async function androidBypass(page) {
  await page.evaluateOnNewDocument(() => {
    // Spoof WebGL Vendor & Renderer for Android
    WebGLRenderingContext.prototype.getParameter = (function (origFn) {
      const paramMap = {
        0x9245: "ARM", // UNMASKED_VENDOR_WEBGL
        0x9246: "Mali-G71", // UNMASKED_RENDERER_WEBGL
      };
      return function (parameter) {
        return paramMap[parameter] || origFn.call(this, parameter);
      };
    })(WebGLRenderingContext.prototype.getParameter);

    WebGL2RenderingContext.prototype.getParameter = (function (origFn) {
      const paramMap = {
        0x9245: "ARM", // UNMASKED_VENDOR_WEBGL
        0x9246: "Mali-G71", // UNMASKED_RENDERER_WEBGL
      };
      return function (parameter) {
        return paramMap[parameter] || origFn.call(this, parameter);
      };
    })(WebGL2RenderingContext.prototype.getParameter);

    // Spoof Navigator Properties for Android
    const modifyNavigator = (originalNavigator) => {
      const override = {
        platform: "Linux armv8l",
        vendor: "Google Inc.",
        userAgent: navigator.userAgent.replace(
          /Windows|Mac OS X|iPhone/g,
          "Android"
        ),
      };

      const handler = {
        get: (target, prop) =>
          override.hasOwnProperty(prop)
            ? override[prop]
            : Reflect.get(target, prop),
      };

      const proxyNavigator = new Proxy(originalNavigator, handler);
      Object.defineProperty(globalThis, "navigator", {
        value: proxyNavigator,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    };

    modifyNavigator(navigator);
  });
}

module.exports = { iphoneBypass, androidBypass };
