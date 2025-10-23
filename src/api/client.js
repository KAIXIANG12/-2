// src/api/client.js
import axios from "axios";

// 你也可以用 Vite 环境变量；目前后端是同域 /api
const api = axios.create({ baseURL: "/api", timeout: 15000 });

// 轻量 token 存取（AT 放 sessionStorage，RT 放 localStorage）
const AT = {
    get: () => sessionStorage.getItem("access_token"),
    set: (v) => sessionStorage.setItem("access_token", v),
    clear: () => sessionStorage.removeItem("access_token"),
};
const RT = {
    get: () => localStorage.getItem("refresh_token"),
    set: (v) => localStorage.setItem("refresh_token", v),
    clear: () => localStorage.removeItem("refresh_token"),
};

// 请求拦截：自动带上 Bearer
api.interceptors.request.use((cfg) => {
    const at = AT.get();
    if (at) cfg.headers.Authorization = `Bearer ${at}`;
    return cfg;
});

// 响应拦截：遇到 401 自动刷新（⚠️ /auth/refresh 要求 body 为“纯字符串”）
let refreshing = null;
api.interceptors.response.use(
    (r) => r,
    async (err) => {
        const { response, config } = err || {};
        if (!response || response.status !== 401 || config.__retried) throw err;

        try {
            if (!refreshing) {
                const rt = RT.get();
                if (!rt) throw err;
                refreshing = axios.post("/api/auth/refresh", rt, {
                    headers: { "Content-Type": "application/json" },
                });
            }
            const res = await refreshing;
            refreshing = null;

            const data = res.data?.data ?? res.data;
            if (data?.accessToken) AT.set(data.accessToken);
            if (data?.refreshToken) RT.set(data.refreshToken);

            config.__retried = true;
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(config);
        } catch (e) {
            refreshing = null;
            AT.clear(); RT.clear();
            window.location.replace("/auth/login");
            throw err;
        }
    }
);

export { api, AT, RT };
