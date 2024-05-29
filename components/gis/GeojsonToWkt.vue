<template>
    <div class="code-container" ref="code_container">

    </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { ref, onMounted } from 'vue';

const code_container = ref<HTMLDivElement>();

onMounted(() => {

    const uri = monaco.Uri.parse('a://b/foo.json');
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate : true,
        enableSchemaRequest: true,
        schemas:[{
            uri : "https://geojson.org/schema/GeoJSON.json",
            fileMatch: [uri.toString()],
        }]
    });

    monaco.editor.create(code_container.value!, {
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true,
        model : monaco.editor.createModel("{}", "json", uri)
    });

    
});

</script>

<style scoped>
.code-container {
    height: 200px;
}
</style>