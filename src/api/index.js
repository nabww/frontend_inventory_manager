import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const getMsg = (e, fallback = "Something went wrong") =>
  e?.response?.data?.message || fallback;

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
  escalationTargets: () => api.get("/users/escalation-targets"),
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
  reportLost: (id, fd) =>
    api.post(`/devices/${id}/report-lost`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  reviewLoss: (id, d) => api.post(`/devices/${id}/review-loss`, d),
  recover: (id, d) => api.post(`/devices/${id}/recover`, d),
  lossDoc: (id, type) =>
    api.get(`/devices/${id}/loss-documents/${type}`, { responseType: "blob" }),
  unverified: (p) => api.get("/devices/unverified", { params: p }),
};

export const userApi = {
  list: (p) => api.get("/users", { params: p }),
  update: (id, d) => api.patch(`/users/${id}`, d),
  remove: (id) => api.delete(`/users/${id}`),
  resendWelcome: (id) => api.post(`/users/${id}/resend-welcome`),
};

export const verifyApi = {
  list: (p) => api.get("/verifications", { params: p }),
};

export const simApi = {
  list: (p) => api.get("/sims", { params: p }),
  export: () => api.get("/sims/export", { responseType: "blob" }),
  update: (id, d) => api.patch(`/sims/${id}`, d),
  link: (id, deviceId) => api.post(`/sims/${id}/link`, { deviceId }),
  unlink: (id) => api.post(`/sims/${id}/unlink`),
};

export const adminContactApi = {
  list: (p) => api.get("/admin-contacts", { params: p }),
  cadres: () => api.get("/admin-contacts/cadres"),
  create: (d) => api.post("/admin-contacts", d),
  update: (id, d) => api.patch(`/admin-contacts/${id}`, d),
  remove: (id) => api.delete(`/admin-contacts/${id}`),
};

export const returnApi = {
  create: (d) => api.post("/returns", d),
  list: (p) => api.get("/returns", { params: p }),
  get: (id) => api.get(`/returns/${id}`),
  review: (id, d) => api.post(`/returns/${id}/review`, d),
  reissue: (id, d) => api.post(`/returns/${id}/reissue`, d),
};

export const transferReqApi = {
  create: (d) => api.post("/transfer-requests", d),
  list: (p) => api.get("/transfer-requests", { params: p }),
  get: (id) => api.get(`/transfer-requests/${id}`),
  review: (id, d) => api.post(`/transfer-requests/${id}/review`, d),
};
export const repairApi = {
  create: (d) => api.post("/repairs", d),
  list: (p) => api.get("/repairs", { params: p }),
  get: (id) => api.get(`/repairs/${id}`),
  // is this line here?
  review: (id, d) => api.post(`/repairs/${id}/review`, d),
  markReturned: (id, d) => api.post(`/repairs/${id}/mark-returned`, d),
  reissue: (id, d) => api.post(`/repairs/${id}/reissue`, d),
};
