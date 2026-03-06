import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({ baseURL: "/api", timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (!err.response) {
      toast.error("Cannot reach server.");
      return Promise.reject(err);
    }
    const { status } = err.response;
    if (status === 401) {
      localStorage.clear();
      if (!window.location.pathname.includes("/login"))
        window.location.href = "/login";
    }
    if (status === 403) toast.error("Access denied.");
    if (status === 429) toast.error("Too many requests.");
    return Promise.reject(err);
  },
);

export const getMsg = (err, fallback = "Something went wrong") => {
  if (!err?.response) return "Network error";
  const d = err.response.data;
  if (d?.errors?.length) return d.errors.map((e) => e.message).join(", ");
  return d?.message || fallback;
};

export default api;

// ── Services
export const authApi = {
  login: (d) => api.post("/auth/login", d),
  me: () => api.get("/auth/me"),
  register: (d) => api.post("/auth/register", d),
  changePw: (d) => api.post("/auth/change-password", d),
};

export const refApi = {
  counties: () => api.get("/counties"),
  subCounties: (id) => api.get(`/counties/${id}/sub-counties`),
  affiliations: () => api.get("/affiliations"),
  createAffiliation: (d) => api.post("/affiliations", d),
  facilities: (p) => api.get("/facilities", { params: p }),
  createFacility: (d) => api.post("/facilities", d),
  updateFacility: (id, d) => api.patch(`/facilities/${id}`, d),
  deleteFacility: (id) => api.delete(`/facilities/${id}`),
  importFacilities: (file) => {
    const f = new FormData();
    f.append("file", file);
    return api.post("/facilities/import", f);
  },
  facility: (id) => api.get(`/facilities/${id}`),
  auditLogs: (p) => api.get("/audit-logs", { params: p }),
  auditLogs: (p) => api.get("/audit-logs", { params: p }),
};

export const deviceApi = {
  dashboard: () => api.get("/dashboard"),
  list: (p) => api.get("/devices", { params: p }),
  get: (id) => api.get(`/devices/${id}`),
  create: (d) => api.post("/devices", d),
  update: (id, d) => api.patch(`/devices/${id}`, d),
  transfer: (id, d) => api.post(`/devices/${id}/transfer`, d),
  remove: (id) => api.delete(`/devices/${id}`),
  verify: (id, d) => api.post(`/devices/${id}/verify`, d),
  export: (p) =>
    api.get("/devices/export", { params: p, responseType: "blob" }),
  import: (file) => {
    const f = new FormData();
    f.append("file", file);
    return api.post("/devices/import", f);
  },
};

export const userApi = {
  list: (p) => api.get("/users", { params: p }),
  update: (id, d) => api.patch(`/users/${id}`, d),
  remove: (id) => api.delete(`/users/${id}`),
};

export const verifyApi = {
  list: (p) => api.get("/verifications", { params: p }),
};

export const auditApi = {
  list: (p) => api.get("/audit-logs", { params: p }),
};
