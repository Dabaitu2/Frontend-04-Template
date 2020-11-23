// 将数组拍平成一维数组。[].concat(...arr)是ES6写法，传统的写法是[].concat.apply([], arr)
export function flatten(arr) {
  return [].concat(...arr)
}
