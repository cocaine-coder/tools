<template>
    <input id="input-file" type="file" accept=".geojson" v-on:change="handleFileChange">
</template>


<script setup lang="ts">
import { creator } from 'wheater';
import turf_bbox from '@turf/bbox'

const id = creator.uuid();
const id_layer = `layer_${id}`;
const id_layer_point = id_layer + "point";
const id_layer_line = id_layer + "line";
const id_layer_polygon = id_layer + "polygon";
const id_source = `source_${id}`;

const props = withDefaults(defineProps<{
    map: maplibregl.Map,
    fitTo?: boolean,
    onLoaded?(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection, sourceId: string, layerIds: string[]): void
}>(), {
    fitTo: true
});

function handleFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.item(0);
    if (file) {
        file.text().then(res => {
            const map = props.map;
            const geojson = JSON.parse(res);

            let box : number[] = []
            try{
                box = turf_bbox(geojson);
            }catch{
                // geojson格式不正确
                (e.target as HTMLInputElement).outerHTML = (e.target as HTMLInputElement).outerHTML;
                return;
            }

            if (map.getSource(id_source)) {
                (map.getSource(id_source) as maplibregl.GeoJSONSource).setData(geojson);
            } else {
                map.addSource(id_source, {
                    type: 'geojson',
                    data: geojson
                });

                map.addLayer({
                    id: id_layer_point,
                    type: 'circle',
                    source: id_source,
                    filter: ['==', '$type', "Point"]
                });

                map.addLayer({
                    id: id_layer_line,
                    type: 'line',
                    source: id_source,
                    filter: ['==', '$type', "LineString"]
                });

                map.addLayer({
                    id: id_layer_polygon,
                    type: 'fill',
                    source: id_source,
                    paint: {
                        "fill-opacity": 0.4,
                        "fill-color": "yellow",
                        "fill-outline-color" : "red",
                    },
                    filter: ['==', '$type', "Polygon"]
                });
            }

            if (props.fitTo) {
                map.fitBounds([box[0], box[1], box[2], box[3]]);
            }

            props.onLoaded?.call(undefined, geojson, id_source, [id_layer_point, id_layer_line, id_layer_polygon]);
        });
    }
}
</script>

<style>
#input-file{
    border-bottom: 1px solid #aaa8ff;
}
</style>