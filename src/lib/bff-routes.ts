export const bffPaths = {
  adminAuthRequestLink: "/api/auth/request-link",
  adminAuthExchange: "/api/auth/exchange",
  adminAuthLogout: "/api/auth/logout",
} as const;

export const bffRoutes = {
  adminAuth: {
    requestLink: () => bffPaths.adminAuthRequestLink,
    exchange: (token: string, next?: string) => {
      const sp = new URLSearchParams({ token });
      if (typeof next === "string" && next.length > 0) sp.set("next", next);
      return `${bffPaths.adminAuthExchange}?${sp.toString()}`;
    },
    logout: () => bffPaths.adminAuthLogout,
  },
} as const;
