// src/api/client.js
import axios from "axios";

/**
 * 后端同学让本地 8080 测试：
 * - 默认 BASE_URL = http://localhost:8080
 * - 也支持用 Vite 环境变量覆盖：VITE_API_BASE_URL
 *   例如 .env 里写：VITE_API_BASE_URL=http://localhost:8080
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// axios 实例：所有 /auth/* 请求都会拼到 BASE_URL 下
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

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

// 响应拦截：遇到 401 自动刷新（后端 @RequestBody String refreshToken → body 需要“纯字符串”）
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

                // 用绝对地址，确保不受 baseURL/相对路径干扰
                refreshing = axios.post(`${BASE_URL}/auth/refresh`, rt, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000,
                });
            }

            const res = await refreshing;
            refreshing = null;

            const data = res.data?.data ?? res.data;
            if (data?.accessToken) AT.set(data.accessToken);
            if (data?.refreshToken) RT.set(data.refreshToken);

            // 重放原请求
            config.__retried = true;
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            // 用我们同一个 axios 实例发起（保留拦截器等）
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
