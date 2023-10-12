<template>
    <Maplibre>
        <template v-slot="slotProps">
            <div>
                <div id="controls">
                    <AppendGeoJSONLayer :map="slotProps.map"
                        :on-loaded="(geojson, sourceId, layerIds) => handleGeoJSONFileLoaded(slotProps.map, geojson, sourceId, layerIds)">
                    </AppendGeoJSONLayer>
                    <Separater></Separater>
                    <AppendRasterLayer :map="slotProps.map" :before-id="id_raster_before"></AppendRasterLayer>
                </div>

                <div id="table">
                    <div>id</div>
                    <div>origin lat</div>
                    <div>origin lng</div>
                    <div>dest lat </div>
                    <div>dest lng</div>
                    <div>操作</div>
                    <template v-for="pair in point_pairs">
                        <div>{{ pair[0] }}</div>
                        <div>{{ pair[1][0] }}</div>
                        <div>{{ pair[1][1] }}</div>
                        <div>{{ pair[1][2] }}</div>
                        <div>{{ pair[1][3] }}</div>
                        <div>
                            <button @click="handleRemovePointPair(slotProps.map, pair[0])">删除</button>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </Maplibre>
</template>

<script setup lang="ts">
import Maplibre from './Maplibre.vue';
import AppendGeoJSONLayer from '../common/AppendGeoJSONLayer.vue';
import AppendRasterLayer from '../common/AppendRasterLayer.vue';
import Separater from '../common/Separater.vue';

import { ref, computed } from 'vue';
import * as turf_meta from '@turf/meta';
import { creator } from 'wheater';
import { GeoJSONSource } from 'maplibre-gl';

const id_choose_points_layer = creator.uuid();
const id_choose_points_source = creator.uuid();
const id_pair_points_source = creator.uuid();
const id_pair_point_line_source = creator.uuid();

const id_raster_before = ref<string | undefined>();
const points = ref<GeoJSON.FeatureCollection<GeoJSON.Point, { id: number, color: string }>>({ type: 'FeatureCollection', features: [] });
const point_pairs = computed(() => {
    const features = points.value.features;
    const ret = new Map<string, [number, number, number, number]>();

    for (let i = 0; i < features.length; i += 2) {
        const current = features[i];
        const next = features[i + 1];

        ret.set(`${current.properties.id}-${next?.properties.id || ''}`, [
            current.geometry.coordinates[0],
            current.geometry.coordinates[1],
            next === undefined ? 0 : next.geometry.coordinates[0],
            next === undefined ? 0 : next.geometry.coordinates[1]]);
    }

    return ret;
});

function updatePairPointLine(map: maplibregl.Map) {
    const features = points.value.features;
    if (features.length % 2 === 0) {
        const source = map.getSource(id_pair_point_line_source) as maplibregl.GeoJSONSource;
        const lines: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
        for (let i = 0; i < features.length; i += 2) {
            const current = features[i];
            const next = features[i + 1];

            lines.features.push({
                type: 'Feature',
                properties: {},
                geometry: {
                    'type': 'LineString',
                    coordinates: [current.geometry.coordinates, next.geometry.coordinates]
                }
            });
        }

        source.setData(lines);
    }
}

function handleRemovePointPair(map: maplibregl.Map, id: string) {
    const ids = id.split('-');
    points.value.features = points.value.features.filter(x => !ids.some(id => id === x.properties.id!.toString())) as any;

    (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData(points.value);
    updatePairPointLine(map);
}

function handleGeoJSONFileLoaded(map: maplibregl.Map, geojson: GeoJSON.Feature | GeoJSON.FeatureCollection, sourceId: string, layerIds: string[]) {
    map.getCanvas().style.cursor = 'crosshair';

    // 切换raster before id
    id_raster_before.value = layerIds[0];

    const points_choose: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: []
    }
    // 获取所有坐标点
    let index = 1;
    turf_meta.coordEach(geojson as any, (coord) => {
        points_choose.features.push({
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

    const source = map.getSource(id_choose_points_source) as GeoJSONSource | undefined;
    if (source) {
        source.setData(points_choose);
        return;
    }

    // 创建触发点图层
    map.addSource(id_choose_points_source, {
        type: 'geojson',
        data: points_choose
    });

    map.addLayer({
        id: id_choose_points_layer,
        type: 'circle',
        source: id_choose_points_source,
        paint: {
            'circle-color': "red",
            'circle-radius': 10,
            'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0]
        }
    });

    let hoverPointId: number | string | undefined;

    map.on('mousemove', id_choose_points_layer, (e) => {
        if (e.features!.length > 0) {
            if (hoverPointId) {
                map.setFeatureState(
                    { source: id_choose_points_source, id: hoverPointId },
                    { hover: false }
                );
            }
            hoverPointId = e.features![0].id;

            map.setFeatureState(
                { source: id_choose_points_source, id: hoverPointId },
                { hover: true }
            );
        }
    });

    map.on('mouseleave', id_choose_points_layer, () => {
        if (hoverPointId) {
            map.setFeatureState(
                { source: id_choose_points_source, id: hoverPointId },
                { hover: false }
            );
        }
        hoverPointId = undefined;
    });

    map.addSource(id_pair_points_source, {
        type: 'geojson',
        data: points.value
    });
    map.addSource(id_pair_point_line_source, {
        type: 'geojson',
        data: { type: "FeatureCollection", features: [] }
    })

    const id_pair_points_layer = creator.uuid();
    map.addLayer({
        id: id_pair_points_layer,
        type: 'circle',
        source: id_pair_points_source,
        paint: {
            "circle-color": ['get', 'color'],
            "circle-stroke-color": "white",
            'circle-stroke-width': 2,
        }
    });
    map.addLayer({
        id: creator.uuid(),
        type: 'line',
        source: id_pair_point_line_source,
        paint: {
            "line-color": "blue",
            'line-width': 2
        }
    }, id_pair_points_layer);
    map.addLayer({
        id: creator.uuid(),
        type: 'symbol',
        source: id_pair_points_source,
        layout: {
            "text-field": ['get', 'id'],
            'text-offset': [1, 0],
            "text-size" : 16
        },
        paint: {
            "text-halo-color" : 'white',
            "text-halo-width" : 2
        }
    })

    map.on('click', id_choose_points_layer, (e) => {
        if (e.features!.length > 0) {
            const feature = e.features![0];

            const id = points.value.features.length + 1;
            const color = id % 2 === 0 ? "green" : "red";
            feature.properties = { id, color };
            points.value.features.push(feature as any);

            (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData(points.value);
            updatePairPointLine(map);
        }
        e.preventDefault();
    });

    map.on('click', e => {
        if (e.defaultPrevented) {
            return;
        }

        const id = points.value.features.length + 1;
        const color = id % 2 === 0 ? "green" : "red";
        points.value.features.push({
            type: 'Feature',
            properties: { id, color },
            geometry: {
                type: 'Point',
                coordinates: [e.lngLat.lng, e.lngLat.lat]
            }
        });

        (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData(points.value);
        updatePairPointLine(map);
    });
}
</script>

<style scoped>
#controls {
    display: flex;
    align-items: center;
}

#points {
    margin: 10px 0;
}

#table {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 0.3fr 1fr 1fr 1fr 1fr auto;
}
</style>