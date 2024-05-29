import { UserConfig, DefaultTheme } from 'vitepress'
import ViteMonacoPlugin  from 'vite-plugin-monaco-editor'

export default {
    title: 'wang-tools',
    description: '解决js/ts微不足道的小事情',
    appearance: 'dark',
    markdown: {
        lineNumbers: true
    },
    themeConfig: {
        sidebar: {
            "/gis": {
                base: "/gis",
                items: [
                    { text: "简介", link: "/" },
                    {
                        text: "坐标纠偏",
                        collapsed: true,
                        items: [
                            { text: "四参数", link: "/coord-rectify-4" }
                        ]
                    }, {
                        text: "数据转换",
                        collapsed: true,
                        items: [
                            { text: "geojson转wkt", link: "/geojson-to-wkt" }
                        ]
                    }]
            }
        },
        nav: [{ 'text': "gis", link: '/gis/' }],
        socialLinks: [{ icon: 'github', link: "https://github.com/cocaine-coder/wang-tools" }],
        aside: false
    },
    vite:{
        plugins:[ViteMonacoPlugin({})]
    }
} as UserConfig<DefaultTheme.Config>