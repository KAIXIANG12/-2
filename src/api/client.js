// src/api/client.js
import axios from "axios";

/**
 * 使用 Vite 代理（/api -> http://localhost:8080）
 */
const api = axios.create({
    baseURL: "/api",
    timeout: 15000,
});

// 轻量 Token 存储
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
    const token = AT.get();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

/** 把后端返回的错误对象“提炼”为一句话 */
function extractMsg(err) {
    const r = err?.response?.data;
    // 常见后端包裹格式：{ message, error:{details}, errors:[...] }
    return (
        r?.error?.details ||
        r?.message ||
        (Array.isArray(r?.errors) && r.errors[0]?.message) ||
        err?.message ||
        "Request failed"
    );
}

let refreshing = null;

// 响应拦截：先处理 401 自动刷新，其它错误统一友好化
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const { response, config } = err || {};

        // 401 且未重试过 → 走刷新逻辑
        if (response && response.status === 401 && !config?.__retried) {
            try {
                if (!refreshing) {
                    const rt = RT.get();
                    if (!rt) throw err; // 没有 refreshToken，直接走失败分支

                    // 仍走同一个 api 实例与代理
                    refreshing = api.post("/auth/refresh", rt, {
                        headers: { "Content-Type": "application/json" },
                        timeout: 15000,
                    });
                }

                const result = await refreshing;
                refreshing = null;

                const data = result.data?.data ?? result.data;
                if (data?.accessToken) AT.set(data.accessToken);
                if (data?.refreshToken) RT.set(data.refreshToken);

                // 重放原请求
                config.__retried = true;
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(config);
            } catch {
                refreshing = null;
                AT.clear();
                RT.clear();
                window.location.replace("/auth/login");
                // 抛出一个干净的错误消息
                return Promise.reject(new Error("Session expired, please login again."));
            }
        }

        // 非 401（或已重试过）→ 统一提炼 message 再抛出
        return Promise.reject(new Error(extractMsg(err)));
    }
);

export { api, AT, RT };
