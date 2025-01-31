export const mobileRandomViewports = [
  {
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // Common Android
  {
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone X/11 Pro
  {
    width: 414,
    height: 896,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // iPhone XR/11
  {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  }, // Pixel 7
  {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 12/13/14
  {
    width: 412,
    height: 869,
    deviceScaleFactor: 2.25,
    isMobile: true,
    hasTouch: true,
  }, // Galaxy S20
  {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 14 Pro
  {
    width: 430,
    height: 932,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  }, // iPhone 14 Pro Max
  {
    width: 360,
    height: 780,
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
  }, // Samsung Galaxy S22
  {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }, // iPhone SE (2nd Gen)
];

// Generate a random viewport size
export function getDesktopRandomViewport() {
  const width = Math.floor(Math.random() * (1560 - 1024)) + 1024; // Width between 1024 and 2560
  const height = Math.floor(Math.random() * (1000 - 768)) + 768; // Height between 768 and 1440
  return { width, height };
}
