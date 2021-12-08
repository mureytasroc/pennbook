
const routes = [
  {
    path: '/',
    component: () => import('pages/Auth.vue'),
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'homepage', component: () => import('pages/Homepage.vue') },
      { path: 'profile', component: () => import('pages/Profile.vue') },
      { path: 'friends', component: () => import('pages/Friends.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
