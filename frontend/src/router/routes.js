const routes = [
  {
    path: "/login",
    component: () => import("pages/Auth.vue"),
  },

  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "homepage", component: () => import("pages/Homepage.vue") },
      { path: "profile", component: () => import("pages/Profile.vue") },
      { path: "friends", component: () => import("pages/Friends.vue") },
      { path: "chat", component: () => import("pages/Chat.vue") },
      { path: "chats", component: () => import("pages/Messages.vue") },
      { path: "news", component: () => import("pages/News.vue") },
    ],
  },

  {
    path: "/chat",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/chat/:catchAll(.*)*",
        component: () => import("pages/Chat.vue"),
      },
    ],
  },

  {
    path: "/wall",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "/wall/:catchAll(.*)*",
        component: () => import("pages/Wall.vue"),
      },
    ],
  },

  //TODO: if user attempts to visit wall/(own user), should redirect to profile

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue"),
  },
];

export default routes;
