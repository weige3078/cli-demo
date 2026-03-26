<template>
    <div :style="{color:bgcolor}">
        {{rate}}
    </div>
</template>
<script setup lang="ts">
    import { computed } from 'vue';
    let props = defineProps({
        value: Number,
        theme: {
            type: String,
            defaut: 'green'
        }
    });
    let rate = computed(() => '★★★★★☆☆☆☆☆'.slice(5-props.value , 10-props.value));
    let theme = {
        green: '#73d13d',
        red: '#f5223d',
        blue: '#45a9fd',
    };

const bgcolor = computed(() => theme[props.theme]);
</script>