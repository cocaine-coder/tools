<template>
    <label :style="{margin:`0 ${margin}px`}">{{value}}</label>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    value?: string,
    margin? : number,
}>(),{
    value : "|",
    margin : 20
});
</script>