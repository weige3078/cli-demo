/**
 * 对对象 key 排序并返回新对象。
 * - 先按 keyOrder 指定的顺序放置（若存在）
 * - 剩余 key 默认按 Unicode 字典序排序（可关闭）
 *
 * @param {Record<string, any>} obj 要排序的对象（会被 delete 已提取的 key）
 * @param {string[]} [keyOrder] 优先排序的 key 列表
 * @param {boolean} [dontSortByUnicode] 为 true 时不对剩余 key 做 keys.sort()
 * @returns {Record<string, any> | undefined} 排序后的新对象；obj 为空时返回 undefined
 */
module.exports = function sortObject(obj, keyOrder, dontSortByUnicode) {
    if (!obj) return
    const res = {}

    if (keyOrder) {
        keyOrder.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res[key] = obj[key]
                delete obj[key]
            }
        })
    }

    const keys = Object.keys(obj)

    !dontSortByUnicode && keys.sort()
    keys.forEach(key => {
        res[key] = obj[key]
    })

    return res
}