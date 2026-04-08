const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export const DEFAULT_LAYOUT = {
    bgImage: "modules/stream-helper/assets/default-bg.png",
    widgets: [
        { id: "widget-hp", name: "Current HP", type: "current-hp", top: 0, left: 0, width: 100, height: 100, zIndex: 1, fontSize: 16, color: "#ffffff", fontFamily: "Arial", enabled: false },
        { id: "widget-max-hp", name: "Max HP", type: "max-hp", top: 0, left: 0, width: 100, height: 100, zIndex: 1, fontSize: 16, color: "#ffffff", fontFamily: "Arial", enabled: false },
        { id: "widget-actor-name", name: "Actor Name", type: "name", top: 0, left: 0, width: 100, height: 100, zIndex: 1, fontSize: 16, color: "#ffffff", fontFamily: "Arial", enabled: false },
        { id: "widget-actor-level", name: "Actor Level", type: "level", top: 0, left: 0, width: 100, height: 100, zIndex: 1, fontSize: 16, color: "#ffffff", fontFamily: "Arial", enabled: false },
        { id: "widget-actor-portrait", name: "Actor Portrait", type: "portrait", top: 0, left: 0, width: 100, height: 100, zIndex: 1, fontSize: 16, color: "#ffffff", fontFamily: "Arial", enabled: false },
    ],
    selectedWidget: null,
}

export class StreamOverlayConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    currentConfig = null;
    selectedWidgetId = null;

    static DEFAULT_OPTIONS = {
        id: "stream-helper-config",
        tag: "div",
        window: {
            title: "Stream Helper Layout",
            resizable: false,
            frame: true,
        },
        actions: {
            // Mapeia o data-action="closeWindow" do seu HBS para a função
            saveLayout: StreamOverlayConfig.#saveLayout,
            defaultLayout: StreamOverlayConfig.#defaultLayout,
            toggleWidget: StreamOverlayConfig.#toggleWidget
        },
    }

    static PARTS = {
        table: {
            template: "modules/stream-helper/templates/stream-overlay-config-layout.hbs"
        }
    }

    static async #saveLayout(event, target) {
        const elements = this.element.querySelectorAll(".draggable-item");
        elements.forEach(el => {
            const id = el.dataset.id;
            const widget = this.currentConfig.widgets.find(w => w.id === id);
            if (widget) {
                widget.top = parseInt(el.style.top);
                widget.left = parseInt(el.style.left);
                widget.width = parseInt(el.style.width);  // Salva largura
                widget.height = parseInt(el.style.height); // Salva altura
            }
        });

        await game.settings.set("stream-helper", "overlay-config", this.currentConfig);

        ui.notifications.info("Configuração salva!");
        this.render(false);
    }

    static async #defaultLayout(event, target) {
        this.currentConfig = DEFAULT_LAYOUT;
        this.render(false);
    }

    static async #toggleWidget(event, target) {
        const type = target.dataset.type;
        // Encontra o widget no seu array de config (carregado no _prepareContext)
        const widget = this.currentConfig.widgets.find(w => w.type === type);

        if (widget) {
            widget.enabled = !widget.enabled;
            console.log(`toggle ${type}:${!widget.enabled}`)
        }

        this.render(false);
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this._setupDraggables();

        const panel = this.element.querySelector(".property-panel");
        if (!panel) return;

        // Use 'input' para feedback em tempo real ou 'change' para validar ao perder o foco
        panel.querySelectorAll("input, select").forEach(input => {
            input.oninput = (e) => {
                const prop = e.target.dataset.prop;
                let val = e.target.value;

                const widget = this.currentConfig.widgets.find(w => w.id === this.selectedWidgetId);
                if (widget) {
                    widget[prop] = (e.target.type === "number") ? parseInt(val) : val;

                    // Em vez de renderizar tudo e perder o foco do input,
                    // podemos atualizar o elemento no canvas diretamente via DOM:
                    const canvasElement = this.element.querySelector(`[data-id="${widget.id}"]`);
                    if (canvasElement) {
                        if (prop === "color") canvasElement.style.color = val;
                        if (prop === "fontSize") canvasElement.style.fontSize = `${val}px`;
                        if (prop === "fontFamily") canvasElement.style.fontFamily = val;
                        if (prop === "zIndex") canvasElement.style.zIndex = val;
                    }
                }
            };

            // Quando o usuário termina de editar (solta o seletor de cor ou sai do campo)
            // aí sim renderizamos para garantir que o Handlebars sincronize tudo
            input.onchange = () => this.render(false);
        });
    }

    _setupDraggables() {
        const items = this.element.querySelectorAll(".draggable-item");

        items.forEach(item => {
            // Injetar o handle de redimensionamento via JS se não estiver no HBS
            if (!item.querySelector(".resizer")) {
                const resizer = document.createElement("div");
                resizer.className = "resizer";
                item.appendChild(resizer);
            }

            item.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();

                this.selectedWidgetId = item.dataset.id;

                const isResizer = e.target.classList.contains("resizer");
                let startX = e.clientX;
                let startY = e.clientY;

                // Valores iniciais do elemento
                const startWidth = item.offsetWidth;
                const startHeight = item.offsetHeight;
                const startTop = item.offsetTop;
                const startLeft = item.offsetLeft;

                const onMouseMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaY = moveEvent.clientY - startY;

                    if (isResizer) {
                        // Lógica de Resize
                        item.style.width = `${startWidth + deltaX}px`;
                        item.style.height = `${startHeight + deltaY}px`;
                    } else {
                        // Lógica de Drag
                        item.style.top = `${startTop + deltaY}px`;
                        item.style.left = `${startLeft + deltaX}px`;
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);

                    const widget = this.currentConfig.widgets.find(w => w.id === this.selectedWidgetId);

                    if (widget) {
                        // 2. Sincronizar os valores do DOM (pixel) para o Objeto (data)
                        // Usamos parseInt para remover o "px" da string
                        widget.top = parseInt(item.style.top);
                        widget.left = parseInt(item.style.left);
                        widget.width = parseInt(item.style.width);
                        widget.height = parseInt(item.style.height);

                        console.log(`[Stream Helper] Sincronizado: ${widget.name} em ${widget.top},${widget.left}`);
                    }
                    this.currentConfig.selectedWidget = widget;

                    // 3. Agora sim, renderiza com os dados atualizados!
                    this.render(false);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            };
        });
    }

    _startDrag(event, target) {
        event.preventDefault();

        // Posição inicial do mouse
        let pos1 = 0, pos2 = 0, pos3 = event.clientX, pos4 = event.clientY;

        this.style.cursor = "grabbing";
    }

    _dragging(event, target) {
        let pos1 = 0, pos2 = 0, pos3 = event.clientX, pos4 = event.clientY;

        event.preventDefault();
        // Calcula o deslocamento
        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;

        // Aplica a nova posição ao elemento da ApplicationV2
        target.style.top = (target.offsetTop - pos2) + "px";
        target.style.left = (target.offsetLeft - pos1) + "px";

        // Importante: No V2, você pode querer atualizar o objeto 'position' interno
        this.position.top = target.offsetTop - pos2;
        this.position.left = target.offsetLeft - pos1;
    }

    _stopDrag(event, target) {

    }

    async _prepareContext(options) {
        if (!this.currentConfig) {
            this.currentConfig = foundry.utils.deepClone(game.settings.get("stream-helper", "overlay-config"));
        }

        // Vincula o widget selecionado ao objeto que vai para o Handlebars
        if (this.selectedWidgetId) {
            this.currentConfig.selectedWidget = this.currentConfig.widgets.find(w => w.id === this.selectedWidgetId);
        } else {
            this.currentConfig.selectedWidget = null;
        }

        return {
            config: this.currentConfig
        }
    }
}