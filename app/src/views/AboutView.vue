<template>
    <div class="about">
        <table>
          <thead>
            <td><input type="checkbox" @change="checkAll"  />全选</td>
            <td>ID</td>
            <td>名字</td>
            <td>年龄</td>
          </thead>
          <tbody>
            <tr v-for="item in arrs" :key="item.id">
              <td><input type="checkbox" :checked="checkedList.indexOf(item.id) !== -1 " :value="item.id" /></td>
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.age }}</td>
            </tr>
          </tbody>
        </table>
    </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
interface IUser {
  id: number;
  name: string;
  checked: boolean;
  age: number;
}
let checkedList = reactive<number[]>([])
let arrs = reactive<IUser[]>([]);
// for (let i = 0; i < 3000; i++) {
//     arrs.push({
//         id: i,
//         name: `大伟${i}`,
//         checked: false,
//         age: Math.floor(Math.random() * 18)
//     });
// }



let index = 0;
function sliceTask() {
  requestAnimationFrame(() => {
        let target = index + 300;
        for (; index < target; index++) {
          arrs.push({
            id: index,
            name: `大伟${index}`,
            checked: false,
            age: Math.floor(Math.random() * 18)
        });
      }
      if (index < 3000) {
        sliceTask();
      }
  });
  
}
sliceTask();


function checkAll() {
  // for (let i = 0; i < arrs.length; i++) {
  //   checkedList.push(arrs[i].id);
  // }
  let index = 0;
  function sliceCheck() {
    requestAnimationFrame(() => {
      let target = index + 300;
      for(; index < target; index++) {
        checkedList.push(arrs[index]?.id);
      }
      if (index < arrs.length) {
        sliceCheck();
      }
    })
  }
  sliceCheck();
}
</script>
<style>
@media (min-width: 1024px) {
    .about {
        /* min-height: 100vh; */
        display: flex;
        align-items: center;
    }
}
</style>

 