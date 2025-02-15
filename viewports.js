export const mobileViewports = [
  { width: 375, height: 667 }, // iPhone 6/7/8
  { width: 414, height: 896 }, // iPhone XR/11
  { width: 390, height: 844 }, // iPhone 12/13/14
  { width: 412, height: 915 }, // Pixel 6/7
  { width: 360, height: 740 }, // Samsung Galaxy S20
  { width: 320, height: 568 }, // iPhone SE (1st gen)
  { width: 360, height: 780 }, // Samsung Galaxy S22
];

export const tabletViewports = [
  { width: 768, height: 1024 }, // iPad Mini
  { width: 810, height: 1080 }, // iPad Air
  { width: 834, height: 1194 }, // iPad Pro 11"
  { width: 1280, height: 800 }, // Android Tablet (Samsung Tab)
  { width: 1024, height: 1366 }, // iPad Pro 12.9"
];

// Generate a random viewport size
export const desktopRandomViewports = [
  {
    width: 1066,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  }, // Common Laptop
  {
    width: 1140,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  }, // MacBook Air 13"
  {
    width: 1236,
    height: 864,
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false,
  }, // Mid-range Laptop
  {
    width: 1250,
    height: 900,
    deviceScaleFactor: 1.25,
    isMobile: false,
    hasTouch: false,
  }, // Widescreen Laptop
  {
    width: 1280,
    height: 1050,
    deviceScaleFactor: 1.5,
    isMobile: false,
    hasTouch: false,
  }, // MacBook Pro 15"
  {
    width: 1220,
    height: 1080,
    deviceScaleFactor: 1.5,
    isMobile: false,
    hasTouch: false,
  }, // Full HD Standard
  {
    width: 1048,
    height: 1152,
    deviceScaleFactor: 1.75,
    isMobile: false,
    hasTouch: false,
  }, // High-Res Laptop
  {
    width: 1160,
    height: 1440,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  }, // 2K Monitor
  {
    width: 1270,
    height: 1800,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  }, // MacBook Pro Retina
  {
    width: 1320,
    height: 2160,
    deviceScaleFactor: 2.5,
    isMobile: false,
    hasTouch: false,
  }, // 4K UHD Monitor
];
