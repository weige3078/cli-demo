# vite-base

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
pnpm test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
pnpm build
pnpm test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```



requestAnimationFrame 主要设计用于在浏览器绘制新帧之前执行动画或视觉上的更新，
以确保页面的平滑渲染。它的回调函数通常每秒调用60次，与显示器的刷新率同步，这样可以创建流畅的动画效果，减少视觉上的卡顿和闪烁。

如果你使用 requestAnimationFrame 来进行分片计算，你必须注意以下几点：

时间敏感性：

requestAnimationFrame 是为了与浏览器的绘制周期同步，如果在每个绘制周期内进行复杂的计算，可能会使得计算影响到帧的渲染时间，导致动画卡顿或延迟。
计算干扰渲染：
因为 requestAnimationFrame 通常用于绘制更新，如果你在这个回调中进行长时间的计算，它会延迟浏览器的渲染，导致用户界面更新不够及时，用户体验受到负面影响。
优先级问题：
requestAnimationFrame 有助于确保渲染操作的优先级，但并不适合后台计算或优先级较低的任务。当页面需要渲染动画或响应用户输入时，你不想这些操作被计算任务所阻塞。
因此，对于需要长时间运行的计算任务，更好的选择是 requestIdleCallback，因为它允许你在浏览器闲置时执行任务，而不是在每个动画帧中。requestIdleCallback 为非紧急任务提供了一个时机，不会妨碍页面的流畅渲染和用户的交互反应。

对于运算量巨大的任务，最合适的方法是使用 Web Workers，因为它们在后台线程中执行，完全不影响主线程的渲染和交互操作。如果无法使用 Web Workers，可以采用 requestIdleCallback 来在主线程的空闲时段进行分片处理。





### 大文件的分片处理机制
当然在面试中，面试官也会常常问到白屏如何优化的问题当然在面试中，面试官也会常常问到白屏如何优化的问题

https://juejin.cn/post/7249907952156721209

###  如何开发一个组件  五星评分组件
https://juejin.cn/post/7389925417786802213
