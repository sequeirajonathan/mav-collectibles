import axios from "axios";

const isServer = typeof window === "undefined";
const isElectron = !isServer && window.electron !== undefined;

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL + "/api/v1"
    : isServer
    ? "http://localhost:3000/api/v1"
    : "/api/v1",
  withCredentials: true,
  headers: {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(isElectron && { "x-electron-app": "true" }),
  },
});

export { axiosClient };
