const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class StreamOverlay extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "stream-helper",
        tag: "aside", // Tag HTML principal
        window: {
            title: "Stream Helper",
            resizable: false,
            frame: false,
            controls: [
                {
                    icon: "fa-solid fa-times", // Ícone de fechar
                    label: "Close Window",
                    action: "closeWindow",
                },
                {
                    icon: "fa-solid fa-times", // Ícone de fechar
                    label: "Detach Window",
                    action: "detachWindow",
                },
            ] // Se deixar vazio, remove os botões de fechar/maximizar
        },
        actions: {
            // Mapeia o data-action="closeWindow" do seu HBS para a função
            closeWindow: StreamOverlay.#onCloseWindow,
            detachWindow: StreamOverlay.#onDetachWindow
        },
        position: {
            width: 300,
            height: "auto",
            left: 100, // Defina uma posição inicial
            top: 100
        }
    };

    static PARTS = {
        table: {
            template: "modules/stream-helper/templates/stream-overlay.hbs"
        }
    };

    static async #onDetachWindow(event, target) {
        await this.detachWindow();
    }

    static #onCloseWindow(event, target) {
        this.close();
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const layout = game.settings.get("stream-helper", "overlay-config");

        context.players = game.actors.filter(a => a.hasPlayerOwner).map(p => ({
            "name": p.name,
            "current-hp": p.system.attributes.hp.value,
            "max-hp": p.system.attributes.hp.max,
            "portrait": p.img, 
            "level": p.system.details.level || 0
        }));

        context.layout = layout;
        console.log(layout)

        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        console.log(context, options);
    }
}