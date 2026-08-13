// Fake network delay, so loading states are visible while there is no real API.

export const MOCK_LATENCY = 700;

export const sleep = (ms = MOCK_LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));
