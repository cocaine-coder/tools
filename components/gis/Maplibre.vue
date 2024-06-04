<template>
    <div id="map" :style="{ height: height ?? '500px', margin: '10px 0' }">
    </div>
    <slot v-if="loaded" :map="map"></slot>
</template>

<script setup lang="ts">
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css"
import { onMounted, onUnmounted, ref } from 'vue';

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
        style: {
            "zoom": 1,
            "pitch": 0,
            "center": [
                120,
                31
            ],
            "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
            "layers": [{
                id: "esri_satellite",
                type: "raster",
                source: "esri_satellite",
            }],
            "bearing": 0,
            "sources": {
                "esri_satellite": {
                    type: 'raster',
                    tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                    maxzoom: 18
                }
            },
            "version": 8,
            "metadata": {
            }
        },
    });

    props.onCreated?.call(undefined, map);

    map.on('load', () => {
        loaded.value = true;
        props.onLoaded?.call(undefined, map);
    });
});

onUnmounted(() => {
    map.remove();
})

</script>

<style scoped></style>