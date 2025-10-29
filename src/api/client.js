// src/api/client.js
import axios from "axios";

/**
 * 方案 A：使用 Vite 代理（/api -> http://localhost:8080）
 * - 在 vite.config.js 中保持：proxy['/api'] = { target: 'http://localhost:8080', changeOrigin: true }
 * - 不要 rewrite，后端路径就是 /api/**
 * 这里统一使用相对 baseURL："/api"
 */
const api = axios.create({
    baseURL: "/api",
    timeout: 15000,
});

/** Token 存取（轻量 MVP） */
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

/** 请求拦截：自动附带 Bearer Token */
api.interceptors.request.use((cfg) => {
    const token = AT.get();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

/**
 * 响应拦截：401 时用刷新令牌换新 AT/RT，然后重放原请求
 * 后端签名：@RequestBody String refreshToken → body 必须是纯字符串
 */
let refreshing = null; // 复用中的刷新请求（防止并发多次刷新）
let subscribers = [];  // 刷新完成后需要重放的请求

function onRefreshed(newAT) {
    subscribers.forEach((cb) => cb(newAT));
    subscribers = [];
}

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const { response, config } = err || {};

        // 无响应 / 非 401 / 已重试过：直接抛出
        if (!response || response.status !== 401 || config.__retried) throw err;

        const rt = RT.get();
        if (!rt) {
            AT.clear();
            RT.clear();
            window.location.replace("/auth/login");
            throw err;
        }

        // 把当前请求包装成等待刷新完成后重放
        const retryOriginal = new Promise((resolve, reject) => {
            subscribers.push((newAT) => {
                try {
                    const newCfg = {
                        ...config,
                        __retried: true,
                        headers: {
                            ...(config.headers || {}),
                            Authorization: `Bearer ${newAT}`,
                        },
                    };
                    resolve(api(newCfg));
                } catch (e) {
                    reject(e);
                }
            });
        });

        try {
            // 若没有在刷新，则发起一次刷新（仍走同一个 api 实例与代理）
            if (!refreshing) {
                refreshing = api.post("/auth/refresh", rt, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000,
                });
            }

            const result = await refreshing;
            refreshing = null;

            const data = result.data?.data ?? result.data;
            const newAT = data?.accessToken;
            const newRT = data?.refreshToken;

            if (newAT) AT.set(newAT);
            if (newRT) RT.set(newRT);

            onRefreshed(newAT || AT.get());
            return retryOriginal; // 返回重放后的结果
        } catch (error) {
            refreshing = null;
            subscribers = [];
            AT.clear();
            RT.clear();
            window.location.replace("/auth/login");
            throw error;
        }
    }
);

export { api, AT, RT };
