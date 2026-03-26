<template>
    <div :style="{color:bgcolor}">
        <div class="rate" @mouseout="mouseOut">
            <span @mouseover="mouseOver(num)" v-for="num in 5" :key="num">☆</span>
            <span class="hollow" :style="fontwidth">
                <span @click="onRate(num)" @mouseover="mouseOver(num)" v-for="num in 5" :key="num">★</span>
            </span>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { computed, ref } from 'vue';
    let props = defineProps({
        value: Number,
        theme: {
            type: String,
            defaut: 'green'
        }
    });
    let width = ref(props.value);
    let fontwidth = computed(() => `width: ${width.value}rem;`);
    let theme = {
        green: '#73d13d',
        red: '#f5223d',
        blue: '#45a9fd',
    };
const bgcolor = computed(() => theme[props.theme]);
let emits = defineEmits(["update-rate"])
const onRate = (num) => {
    emits("update-rate", num)
}
function mouseOver(i) {
    width.value = i;
} 
function mouseOut() {
    width.value = props.value;
}

</script>
<style scoped>
    .rate {
        position: relative;
        display: block;
    }
    .rate span{
        display: inline-block;
        width: 1rem;
        height: 22px;
        overflow: hidden;
    }
    .rate > span.hollow {
        position: absolute;
        display:block;
        top:0;
        left:0;
        width:0;
        overflow:hidden;
    }

</style>