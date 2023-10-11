<template>
    <Maplibre>
        <template v-slot="slotProps">
            <div>
                <AppendGeoJSONLayer :map="slotProps.map"
                    :on-loaded="(geojson, sourceId, layerIds) => handleGeoJSONFileLoaded(slotProps.map, geojson, sourceId, layerIds)">
                </AppendGeoJSONLayer>
            </div>
        </template>
    </Maplibre>
</template>

<script setup lang="ts">
import Maplibre from './Maplibre.vue';
import AppendGeoJSONLayer from '../common/AppendGeoJSONLayer.vue';
import * as turf_meta from '@turf/meta';
import { creator } from 'wheater';


function handleGeoJSONFileLoaded(map: maplibregl.Map, geojson: GeoJSON.Feature | GeoJSON.FeatureCollection, sourceId: string, layerIds: string[]) {
    const points: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: []
    }
    // 获取所有坐标点
    let index = 1;
    turf_meta.coordEach(geojson as any, (coord) => {
        points.features.push({
            type: 'Feature',
            id: index,
            geometry: {
                type: 'Point',
                coordinates: coord
            },
            properties: {}
        });

        index++;
    });

    // 创建触发点图层
    const id_layer = creator.uuid();
    const id_source = creator.uuid();
    map.addSource(id_source, {
        type: 'geojson',
        data: points
    })

    map.addLayer({
        id: id_layer,
        type: 'circle',
        source: id_source,
        paint: {
            'circle-color': "red",
            'circle-radius': 10,
            'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0]
        }
    });

    let hoverPointId: number | string | undefined;

    map.on('mousemove', id_layer, (e) => {
        if (e.features!.length > 0) {
            if (hoverPointId) {
                map.setFeatureState(
                    { source: id_source, id: hoverPointId },
                    { hover: false }
                );
            }
            hoverPointId = e.features![0].id;

            console.log(hoverPointId);
            map.setFeatureState(
                { source: id_source, id: hoverPointId },
                { hover: true }
            );
        }
    });

    map.on('mouseleave', id_layer, () => {
        if (hoverPointId) {
            map.setFeatureState(
                { source: id_source, id: hoverPointId },
                { hover: false }
            );
        }
        hoverPointId = undefined;
    });
}
</script>

<style scoped></style>