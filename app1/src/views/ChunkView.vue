<template>
    <div>
        <h1>chunk data</h1>
    </div>
</template>
<script setup lang="ts">
async function loadText() {
    const url = 'https://dawei-test-110.oss-cn-beijing.aliyuncs.com/test.txt?Expires=1720715989&OSSAccessKeyId=TMP.3KdbmjMMEpcCwJVjgYZUCwSqt36ujP2gF9tRxe68MAWSNFeWTHk5SK7XwMmHQxQUr3soXiK3T3N19j2FBXhd7YTHgXrfAR&Signature=UUO9FBM7tXZOUjw2GL3Hn24zKlI%3D&response-content-type=text%2Fplain%3Bcharset%3Dutf-8%3B';
    const res = await fetch(url);
    const reader = res?.body?.getReader();
    // const { value, done } = await reader.read();


    // 新建一个文本解码器
    const decoder = new TextDecoder();
    // 使用 decoder.decode 将读取的切片数据传入进去，就会得到文本数据
    // const text = decoder.decode(value);
    // 打印一下 text，看看是否转化文本数据
    // console.log("text >>> ", text);

    // console.log(value, done);


    // 为方便测试，我们声明一个变量，代表第几次读取 text 的值
    let num = 0;
  // for 无限定条件永远循环
    for (;;) {
    // 每一次循环都读取一次数据
    const { value, done } = await reader!.read();
    // 如果完成了直接退出
    if (done) {
        break;
    }
    // 为完成读取文本
    const text = decoder.decode(value);
    // 输出 text
    console.log(`${num++} text >>> `, text);

    // const text = await res.text();
    // console.log(text);
}
}
loadText();

</script>