<template>
    <div v-show="caling" class="mask"></div>
    <Maplibre>
        <template v-slot="slotProps">
            <div>
                <div id="controls">
                    <AppendGeoJSONLayer :map="slotProps.map"
                        :on-loaded="(geojson, sourceId, layerIds) => handleGeoJSONFileLoaded(slotProps.map, geojson, sourceId, layerIds)">
                    </AppendGeoJSONLayer>
                    <Separater></Separater>
                    <AppendRasterLayer :map="slotProps.map" :before-id="id_raster_before"></AppendRasterLayer>
                    <Separater></Separater>
                    <div style="display: flex;flex-direction: row-reverse;flex: 1;">
                        <button v-show="saveRef" @click="saveRef()">下载结果</button>
                        <Separater v-show="saveRef"></Separater>
                        <button v-show="canCal" @click="cal(slotProps.map)">计算</button>
                        <Separater v-show="canCal"></Separater>
                        <button @click="clear(slotProps.map)">清空</button>
                    </div>
                </div>

                <div id="table">
                    <div>id</div>
                    <div>原始 经度</div>
                    <div>原始 纬度</div>
                    <div>实际 经度</div>
                    <div>实际 纬度</div>
                    <div>操作</div>
                    <template v-for="pair in point_pairs">
                        <div>{{ pair[0] }}</div>
                        <div>{{ pair[1][0].toFixed(6) }}</div>
                        <div>{{ pair[1][1].toFixed(6) }}</div>
                        <div>{{ pair[1][2].toFixed(6) }}</div>
                        <div>{{ pair[1][3].toFixed(6) }}</div>
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
import { creator, deep } from 'wheater';
import { GeoJSONSource } from 'maplibre-gl';
import { saveAs } from 'file-saver';
import proj4 from 'proj4';
import Matrix from '../../libs/matrix';

const id_choose_points_layer = creator.uuid();
const id_choose_points_source = creator.uuid();
const id_pair_points_source = creator.uuid();
const id_pair_point_line_source = creator.uuid();

const id_result_source = creator.uuid();
const id_result_layer = creator.uuid();

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

const canCal = computed(() => {
    return point_pairs.value.size > 3 && points.value.features.length % 2 === 0;
});
const caling = ref(false);

const saveRef = ref<() => void>();

let source_deata: GeoJSON.FeatureCollection;

/**
 * 更新点对之间的连线
 * @param map 
 */
function updatePairPointLine(map: maplibregl.Map) {
    const features = points.value.features;
    const source = map.getSource(id_pair_point_line_source) as maplibregl.GeoJSONSource;

    const lines: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < features.length; i += 2) {
        const current = features[i];
        const next = features[i + 1];

        if (current && next)
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

/**
 * 删除点对
 * @param map 
 * @param id 
 */
function handleRemovePointPair(map: maplibregl.Map, id: string) {
    const ids = id.split('-');
    points.value.features = points.value.features.filter(x => !ids.some(id => id === x.properties.id!.toString())) as any;
    points.value.features.forEach((v, i) => {
        v.properties.id = i + 1;
    });
    (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData(points.value);
    updatePairPointLine(map);
}

/**
 * 加载geojson文件
 * @param map 
 * @param geojson 
 * @param sourceId 
 * @param layerIds 
 */
function handleGeoJSONFileLoaded(map: maplibregl.Map, geojson: GeoJSON.Feature | GeoJSON.FeatureCollection, sourceId: string, layerIds: string[]) {
    source_deata = geojson.type === 'Feature' ? { type: 'FeatureCollection', features: [geojson] } : geojson;
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
            "text-size": 16
        },
        paint: {
            "text-halo-color": 'white',
            "text-halo-width": 2
        }
    });

    function addPoint(feature: GeoJSON.Feature) {
        const id = points.value.features.length + 1;
        const color = id % 2 === 0 ? "green" : "red";
        feature.properties = { id, color };
        points.value.features.push(feature as any);

        (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData(points.value);
        updatePairPointLine(map);
    }

    map.on('click', id_choose_points_layer, (e) => {
        if (e.features!.length > 0) {
            const feature = e.features![0];
            addPoint(feature);
        }
        e.preventDefault();
    });

    map.on('click', e => {
        if (e.defaultPrevented) {
            return;
        }

        addPoint({
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [e.lngLat.lng, e.lngLat.lat]
            }
        });
    });
}

function cal(map: maplibregl.Map) {
    caling.value = true;

    try {
        const common_point_length = point_pairs.value.size;
        const L = Matrix.zero(2 * common_point_length, 1);
        const B = Matrix.zero(2 * common_point_length, 4);
        const P = Matrix.identity(2 * common_point_length);

        const espg_3857 = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs";
        let index = 1;
        point_pairs.value.forEach(value => {
            const org = proj4(espg_3857, value.slice(0, 2));
            const dest = proj4(espg_3857, value.slice(2));

            L.set(index, 1, dest[0] - org[0]);
            L.set(index + 1, 1, dest[1] - org[1]);

            B.setRow(index, [1, 0, org[0], -org[1]]);
            B.setRow(index + 1, [0, 1, org[1], org[0]]);

            index++;
        });

        const X = B.transpose().mul(P).mul(B).inverse().mul(B.transpose()).mul(P).mul(L);
        const V = B.mul(X).sub(L);

        const dertX = X.get(1, 1);
        const dertY = X.get(2, 1);
        const a = X.get(3, 1);
        const b = X.get(4, 1);

        const data_copy = deep.clone(source_deata);
        turf_meta.coordEach(data_copy, (currentCoord) => {
            const xy = proj4(espg_3857, currentCoord);
            const x = xy[0];
            const y = xy[1];

            const _xy = [
                dertX + (1 + a) * x - b * y,
                dertY + b * x + (1 + a) * y
            ];
            deep.setProps(
                proj4(espg_3857, proj4.WGS84, _xy)
                ,
                currentCoord
            );
        });

        const source = map.getSource(id_result_source) as maplibregl.GeoJSONSource;
        if (!source) {
            map.addSource(id_result_source, {
                type: 'geojson',
                data: data_copy
            });

            map.addLayer({
                id: id_result_layer + "point",
                type: 'circle',
                source: id_result_source,
                paint: {
                    "circle-color": 'green'
                },
                filter: ['==', '$type', "Point"]
            });

            map.addLayer({
                id: id_result_layer + "line",
                type: 'line',
                source: id_result_source,
                paint: {
                    "line-color": "green"
                },
                filter: ['==', '$type', "LineString"]
            });

            map.addLayer({
                id: id_result_layer + "polygon",
                type: 'fill',
                source: id_result_source,
                paint: {
                    "fill-opacity": 0.4,
                    "fill-color": "green",
                    "fill-outline-color": "blue",
                },
                filter: ['==', '$type', "Polygon"]
            });
        } else {
            source.setData(data_copy);
        }

        saveRef.value = () => {
            console.log("下载文件")
            saveAs(new Blob([JSON.stringify(data_copy)],{
                type: 'application/json'
            }) , "result.geojson");
        }
    } catch {

    } finally {
        caling.value = false;
    }
}

function clear(map: maplibregl.Map) {
    points.value = { type: 'FeatureCollection', features: [] };
    (map.getSource(id_pair_points_source) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    (map.getSource(id_pair_point_line_source) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
    (map.getSource(id_result_source) as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });

    saveRef.value = undefined;
}
</script>

<style scoped>
.mask {
    width: 100%;
    height: 100%;
    z-index: 1000;
    position: absolute;
    background-color: #00000022;
}

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