import { StreamOverlay } from './stream-overlay.js'
import { StreamOverlayConfig, DEFAULT_LAYOUT } from './stream-overlay-config.js'

let streamHelperOverlay = null;

Hooks.on("init", async function () {
    //CONFIG.debug.hooks = true;
    await game.settings.register("stream-helper", "overlay-config", {
        name: "Configuração do Overlay",
        scope: "world",      // "world" salva no servidor (SQL Server style), "client" é local
        config: false,
        default: DEFAULT_LAYOUT,
    });

    game.settings.registerMenu("stream-helper", "layout-config-menu", {
        name: "Adjust Layout Overlay",
        label: "Open Layout Config",
        hint: "Ajuste as posições dos elementos para a stream.",
        icon: "fas fa-desktop",
        type: StreamOverlayConfig, // A classe da ApplicationV2
        restricted: true // Apenas GMs
    });

    game.settings.register("stream-helper", "bgImage", {
    name: "Background Image",
    hint: "Pick a image to be the background of the overlay.",
    scope: "world",      // "world" salva no servidor (GM), "client" é local
    config: true,       // Faz aparecer na aba de configurações do Foundry
    type: String,
    filePicker: "image", // MÁGICA: Transforma o campo num FilePicker nativo
    default: "modules/stream-helper/assets/default-bg.png",
    onChange: (value) => {
        const currentLayout = game.settings.get("stream-helper", "overlay-config");
        currentLayout.bgImage = value;
        game.settings.set("stream-helper", "overlay-config", currentLayout);

        console.log(value)
        console.log(currentLayout)
        // // Se a configuração mudar, atualiza o rascunho se o editor estiver aberto
        // const menu = Object.values(ui.windows).find(app => app instanceof StreamOverlayConfig);
        // if (menu) {
        //     menu.currentConfig.bgImage = value;
        //     menu.render(false);
        // }
    }
});

    console.log("[Stream Helper] Initialized...");
});

// Updates overlay on token change
Hooks.on("modifyTokenAttribute", (data, updateData, actor) => {
    if (foundry.utils.hasProperty(updateData, "system.attributes.hp")) {
        console.log("HP detectado com sucesso!");
        if (streamHelperOverlay?.rendered)
            streamHelperOverlay.render(false);
    }
});

// Updates overlay on actor change
Hooks.on("updateActor", (document, change, options, userId) => {
    if (foundry.utils.hasProperty(change, "system.attributes.hp")) {
        console.log("HP detectado com sucesso!");
        if (streamHelperOverlay?.rendered)
            streamHelperOverlay.render(false);
    }
});

// Add button to configuration
Hooks.on("getSceneControlButtons", (controls) => {
    const streamControl = {
        name: "stream-helper",
        title: "Stream Helper",
        icon: "fas fa-tower-broadcast",
        layer: "controls",
        visible: game.user.isGM,
        tools: {
            "openOverlay": {
                name: "openOverlay",
                title: "Open Overlay",
                icon: "fas fa-desktop",
                button: true,
                onChange: async (event) => {
                    if (!streamHelperOverlay?.rendered) {
                        streamHelperOverlay = new StreamOverlay();
                        streamHelperOverlay.render(true, { focus: true });
                        await streamHelperOverlay.detachWindow();
                    }
                }
            }
        }
    };

    controls["stream-helper"] = streamControl;
});


// Change title of window on detach
Hooks.on("openDetachedWindow", (id, win) => {
    if (id === "stream-helper") {
        win.document.title = "Foundry Virtual Tabletop - Stream Helper"
    }
})

Hooks.on("updateSetting", (setting, changes, options, userId) => {
    console.log("settings")
    // Verifique se a configuração alterada é a do seu módulo
    if (setting.key === "stream-helper.overlay-config") {
        console.log("[Stream Helper] setting update detected via updateSetting!");

        // streamHelperOverlay deve estar acessível no escopo global ou via ui.windows
        if (streamHelperOverlay?.rendered) {
            console.log("[Stream Helper] updating overlay...");
            streamHelperOverlay.render(false);
        }
    }
});