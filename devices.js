import UserAgent from "user-agents";

const userAgent = new UserAgent({ deviceCategory: "mobile" });
export const userAgents = Array(1000)
  .fill()
  .map(() => userAgent());

export const iphoneDevices = userAgents.filter((userAgent) =>
  userAgent.data.userAgent.includes("iPhone")
);
export const androidDevices = userAgents.filter((userAgent) =>
  userAgent.data.userAgent.includes("Android")
);
