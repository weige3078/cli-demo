const chalk = require('chalk')
const figlet = require('figlet')

try {
    const text = figlet.textSync('MVC-CLI', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
    })
    console.log(chalk.cyan(text))
} catch {
    console.log(chalk.cyan('MVC-CLI'))
}

