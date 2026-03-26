let ejs
try {
  ejs = require('ejs')
} catch (e) {
  console.error('缺少依赖 ejs，请先安装：npm i ejs')
  process.exit(1)
}

const template = `
<h1><%= title %></h1>
<%_ if (isProd) { _%>
<script>console.log('prod')</script>
<%_ } else { _%>
<script>console.log('dev')</script>
<%_ } _%>
<ul>
  <%_ items.forEach(i => { _%>
  <li><%= i %></li>
  <%_ }) _%>
</ul>
`.trim()

const html = ejs.render(template, {
  title: 'EJS Demo',
  isProd: process.env.NODE_ENV === 'dev',
  items: ['a', 'b', 'c'],
})

console.log(html)
