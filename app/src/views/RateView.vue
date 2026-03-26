<template>
    <div class="rate">
        <Rate :value="5" />
        <Rate :value="4" />
        <Rate :value="3" />
        <Rate1 :value="2" theme="blue" />
        <Rate2 :value="score" theme="red" @update-rate="update" />
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Rate from '../components/Rate.vue';
import Rate1 from '../components/Rate1.vue';
import Rate2 from '../components/Rate2.vue';
let score = ref(2);
const update = (value: number) => {
    score.value = value;
}
</script>
<style scoped>
    .rate {
        margin: 0 auto;
    }
</style>