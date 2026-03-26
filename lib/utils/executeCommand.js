const execa = require('execa')
module.exports = function executeCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        const child = execa.command(command, {
            cwd,
            /* 
                三个选项分别对应：
               stdin = 'inherit'： 子进程直接用用户的输入
               stdout = 'pipe'：把子进程的正常输出“接到一根管子里”给 Node 程序
               stderr = 'inherit'：子进程的错误输出直接显示到当前终端
                不用你自己监听 child.stderr，报错会直接出现在屏幕上
            */
            stdio: ['inherit', 'pipe', 'inherit'],
        })

        child.stdout.on('data', buffer => {
            process.stdout.write(buffer)
        })

        child.on('close', code => {
            /* 
                子进程结束时触发 
                code是退出码：一般0 表示成功，非0表示失败
            */
            if (code !== 0) {
                reject(new Error(`command failed: ${command}`))
                return
            }

            resolve()
        })
    })
}