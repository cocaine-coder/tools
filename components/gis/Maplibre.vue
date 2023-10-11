<template>
    <div id="map" :style="{height:height ?? '500px',margin:'10px 0'}">
    </div>
    <slot v-if="loaded" :map="map"></slot>
</template>

<script setup lang="ts">
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css"
import { onMounted,onUnmounted ,ref} from 'vue';

const props = defineProps<{
    height?: string,
    onCreated?(map: maplibregl.Map): void,
    onLoaded?(map: maplibregl.Map): void
}>();

let map: maplibregl.Map;
const loaded = ref(false);

onMounted(() => {
    map = new maplibregl.Map({
        container: 'map',
        style: "https://demotiles.maplibre.org/style.json",
    });

    props.onCreated?.call(undefined, map);

    map.on('load', () => {
        loaded.value = true;
        props.onLoaded?.call(undefined, map);
    });
});

onUnmounted(()=>{
    map.remove();
})

</script>

<style scoped></style>