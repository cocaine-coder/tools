<template>
    <div>
        <label>栅格瓦片</label>
        <input id="input-url" type="text" v-model="url">
        <button id="btn-refresh" @click="handleRefreshClick">刷新</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { creator, validator } from 'wheater';

const props = defineProps<{
    map: maplibregl.Map,
    beforeId?: string
}>();
const url = ref("");
const id_layer = creator.uuid();
const id_source = creator.uuid();

function handleRefreshClick() {
    const source = props.map.getSource(id_source) as maplibregl.RasterTileSource | undefined;
    if (source) {
        if (source.tiles.indexOf(url.value) !== -1)
            return;

        props.map.removeLayer(id_layer);
        props.map.removeSource(id_source);
    }

    props.map.addSource(id_source, {
        type: 'raster',
        tiles: [url.value]
    });

    props.map.addLayer({
        id: id_layer,
        type: 'raster',
        source: id_source
    }, props.beforeId);
}

</script>

<style scoped>
#input-url {
    border-bottom: 1px solid #aaa8ff;
    width: 300px;
    margin: 0 10px;
}

#btn-refresh {
    padding: 0 16px;
    border: 1px solid black;
    background-color: #aaa8ff;
}
</style>