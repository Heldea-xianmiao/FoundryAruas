// FoundryAuras - Main Engine
import { AuraManager } from "./scripts/manager.js";

class AuraEngine {
    constructor() {
        // Store all defined Aura data
        // 存储所有定义的 Aura 数据
        this.auras = []; 
        
        // Store active Aura instance IDs
        // 存储当前显示的 Aura 实例 ID
        this.activeAuras = new Map();
        
        // Preview mode state
        // 预览模式状态
        this.previewMode = false;
        this.currentPreviewId = null;
    }

    // Initialize: Inject HUD into the interface
    // 初始化：注入 HUD 到界面中
    init() {
        console.log("FoundryAuras | Initializing Engine...");

        // Register settings in init hook
        // 在 init 钩子中注册设置
        Hooks.once('init', () => {
             this.registerSettings();
        });
        
        // Create HUD container
        // 创建 HUD 容器
        Hooks.on('ready', () => {
            // Register Tour manually if json method fails
            if (game.tours) {
                const tourId = "FoundryAuras.guide";
                // Only register if not exists
                if (!game.tours.get(tourId)) {
                    console.log("FoundryAuras | Manually registering tour...", tourId);
                    game.tours.register("FoundryAuras", "guide", {
                        title: "FOUNDRYAURAS.Tour.Title",
                        description: "FOUNDRYAURAS.Tour.Description",
                        canBeResumed: true,
                        display: true,
                        steps: [
                            {
                                id: "welcome",
                                selector: ".fa-container",
                                title: "FOUNDRYAURAS.Tour.Step1.Title",
                                content: "FOUNDRYAURAS.Tour.Step1.Content"
                            },
                            {
                                id: "sidebar",
                                selector: ".fa-sidebar",
                                title: "FOUNDRYAURAS.Tour.Step2.Title",
                                content: "FOUNDRYAURAS.Tour.Step2.Content"
                            },
                            {
                                id: "presets",
                                selector: "button[data-action='preset']",
                                title: "FOUNDRYAURAS.Tour.Step3.Title",
                                content: "FOUNDRYAURAS.Tour.Step3.Content"
                            },
                            {
                                id: "editor-tabs",
                                selector: ".fa-tabs",
                                title: "FOUNDRYAURAS.Tour.Step4.Title",
                                content: "FOUNDRYAURAS.Tour.Step4.Content"
                            },
                            {
                                id: "scan",
                                selector: "button[data-action='scan']",
                                title: "FOUNDRYAURAS.Tour.Step5.Title",
                                content: "FOUNDRYAURAS.Tour.Step5.Content"
                            },
                            {
                                id: "save",
                                selector: "button[type='submit']",
                                title: "FOUNDRYAURAS.Tour.Step6.Title",
                                content: "FOUNDRYAURAS.Tour.Step6.Content"
                            }
                        ]
                    });
                }
            }

            // Create HUD only for the current client user
            // 仅为当前客户端用户创建 HUD
            // Use vanilla JS for better compatibility with future FVTT versions (V13/V14)
            // 使用原生 JS 以更好地兼容未来的 FVTT 版本 (V13/V14)
            if (!document.getElementById('foundry-auras-hud')) {
                const hud = document.createElement('div');
                hud.id = 'foundry-auras-hud';
                document.body.appendChild(hud);
            }
            this.loadAuras();
            this.registerHooks();
        });
    }

    registerSettings() {
        // Register the data storage setting
        // 注册数据存储设置
        game.settings.register("FoundryAuras", "auras", {
            name: game.i18n.localize("FOUNDRYAURAS.Settings.Definitions.Name"),
            scope: "world",
            config: false, // Hidden directly, managed by menu // 直接隐藏，由菜单管理
            type: Object,
            default: this.getDefaultAuras(), // We'll move the default list here // 我们将默认列表移到这里
            onChange: value => {
                this.auras = value;
                console.log("FoundryAuras | Settings updated, reloading auras...");

                // Don't refresh preview in onChange - let the manager handle it
                // 不要在 onChange 中刷新预览 - 让管理器处理它
                if (!this.previewMode) {
                    if (canvas.tokens && canvas.tokens.controlled[0]) {
                         this.checkAuras("updateActor", canvas.tokens.controlled[0].actor);
                    }
                }
            }
        });

        // Register the menu button
        // 注册菜单按钮
        game.settings.registerMenu("FoundryAuras", "manager", {
            name: game.i18n.localize("FOUNDRYAURAS.Settings.Manager.Name"),
            label: game.i18n.localize("FOUNDRYAURAS.Settings.Manager.Label"), 
            hint: game.i18n.localize("FOUNDRYAURAS.Settings.Manager.Hint"),
            icon: "fas fa-laptop-code",
            type: AuraManager,
            restricted: true
        });

        // Register Keybinding
        game.keybindings.register("FoundryAuras", "openManager", {
            name: "FOUNDRYAURAS.Settings.Manager.Label",
            hint: "FOUNDRYAURAS.Settings.Manager.Hint",
            editable: [
                { key: "KeyA", modifiers: ["SHIFT", "ALT"] }
            ],
            onDown: () => {
                new AuraManager().render(true);
            },
            restricted: true,
            precedence: 0
        });
    }

    // Default Auras (Moved from loadAuras)
    // 默认光环 (从 loadAuras 移出)
    getDefaultAuras() {
         return [
            {
                id: "low-health-warning",
                name: "FOUNDRYAURAS.Sample.Name",
                type: "icon",
                trigger: {
                    type: "event",
                    event: "updateActor", 
                },
                // Note: Function serialization is tricky in JSON settings.
                // For MVP we just store non-function data, hardcoding logic for now.
                // Or we store script string and eval (dangerous but powerful, like standard WA).
                // 注意：JSON 设置中函数序列化很棘手。
                // MVP 阶段我们只存储非函数数据，逻辑暂时硬编码。
                // 或者我们存储脚本字符串并 eval（危险但强大，类似标准 WA）。
                conditionScript: `
                    if (!actor.isOwner) return false;
                    const hp = actor.system.attributes?.hp;
                    if (!hp) return false;
                    const percent = (hp.value / hp.max) * 100;
                    return percent < 50 && percent > 0;
                `,
                display: {
                    icon: "icons/svg/skull.svg",
                    text: "FOUNDRYAURAS.Sample.LowHealth", 
                    mode: "both",  /* 改为同时显示图标和文本，更容易看到 */
                    animation: "anim-pulse",
                    posX: "400px",  /* 改为固定像素值 */
                    posY: "200px"   /* 改为固定像素值 */
                }
            }
        ];
    }

    // Mock: Load Aura definitions from settings
    // 模拟：从设置中加载 Aura 定义
    loadAuras() {
        // Load from settings
        // 从设置加载
        let savedAuras = game.settings.get("FoundryAuras", "auras");
        console.log("FoundryAuras | loadAuras: savedAuras =", savedAuras);
        
        // Convert script strings to functions (Runtime evaluation)
        // 将脚本字符串转换为函数 (运行时评估)
        this.auras = savedAuras.map(aura => {
            console.log(`FoundryAuras | Processing saved aura: ${aura.name}`);
            
            // Data migration: Ensure all required fields exist
            // 数据迁移：确保所有必需字段存在
            if (!aura.conditionMode) aura.conditionMode = "script";
            if (!aura.simpleCondition) {
                aura.simpleCondition = { property: "hp", operator: "lt", value: "50", checkType: "percent" };
            }
            if (!aura.display) aura.display = {};
            if (!aura.display.posX) aura.display.posX = "50%";
            if (!aura.display.posY) aura.display.posY = "50%";
            if (!aura.display.mode) aura.display.mode = "both";
            // Display mode specific defaults
            if (aura.display.mode === "icon") {
                if (!aura.display.iconWidth) aura.display.iconWidth = 64;
                if (!aura.display.iconHeight) aura.display.iconHeight = 64;
                if (!aura.display.iconAnimation) aura.display.iconAnimation = "none";
                if (!aura.display.iconAnimationOptions) aura.display.iconAnimationOptions = {};
            } else if (aura.display.mode === "text") {
                if (!aura.display.textFontSize) aura.display.textFontSize = 24;
                if (!aura.display.textFontColor) aura.display.textFontColor = "#ffffff";
                if (!aura.display.textAnimation) aura.display.textAnimation = "none";
                if (!aura.display.textAnimationOptions) aura.display.textAnimationOptions = {};
            } else if (aura.display.mode === "both") {
                if (!aura.display.bothWidth) aura.display.bothWidth = 64;
                if (!aura.display.bothHeight) aura.display.bothHeight = 64;
                if (!aura.display.bothFontSize) aura.display.bothFontSize = 24;
                if (!aura.display.bothFontColor) aura.display.bothFontColor = "#ffffff";
                if (!aura.display.bothAnimation) aura.display.bothAnimation = "none";
                if (!aura.display.bothAnimationOptions) aura.display.bothAnimationOptions = {};
            }
            if (!aura.display.width) aura.display.width = 64;
            if (!aura.display.height) aura.display.height = 64;
            if (!aura.display.fontSize) aura.display.fontSize = 24;
            if (!aura.display.fontColor) aura.display.fontColor = "#ffffff";
            if (aura.display.opacity === undefined) aura.display.opacity = 1;
            if (!aura.display.animationOptions) aura.display.animationOptions = {};
            if (!aura.display.borderColor) aura.display.borderColor = "";
            if (!aura.display.borderSize) aura.display.borderSize = 0;
            if (!aura.display.backgroundColor) aura.display.backgroundColor = "";
            if (!aura.display.shadowColor) aura.display.shadowColor = "";
            if (!aura.display.shadowSize) aura.display.shadowSize = 0;
            if (!aura.display.rotation) aura.display.rotation = 0;
            if (!aura.display.scale) aura.display.scale = 1;
            if (!aura.trigger) aura.trigger = { type: "event", event: "updateActor" };
            
            // New Mode Handling: Simple vs Script
            // 简单模式 vs 脚本
            if (aura.conditionMode === "simple" && aura.simpleCondition) {
                // Generate function from simple condition config
                // 从简单条件配置生成函数
                aura.condition = this._generateSimpleCondition(aura.simpleCondition);
            } else if (aura.conditionScript) {
                try {
                    // Create function from string: condition(actor, token, game) { ... }
                    aura.condition = new Function("actor", "token", "game", aura.conditionScript);
                } catch (e) {
                    console.error(`FoundryAuras | Failed to compile script for ${aura.name}:`, e);
                    aura.condition = () => false; // Fail safe
                }
            } else {
                 aura.condition = () => true; // Always show if no condition
            }
            return aura;
        });

        console.log(`FoundryAuras | loadAuras completed: loaded ${this.auras.length} auras`);
    }

    // Helper: Generate condition function from simple config
    // 辅助：从简单配置生成条件函数
    _generateSimpleCondition(config) {
        return (actor, token) => {
            if (!actor || !actor.system) return false;
            
            // HP CHECK
            // 生命值检查
            if (config.property === 'hp') {
                const hp = actor.system.attributes?.hp;
                if (!hp) return false;
                
                let val = config.checkType === 'percent' ? (hp.value / hp.max * 100) : hp.value;
                let target = parseFloat(config.value);
                
                switch (config.operator) {
                    case 'lt': return val < target;
                    case 'lte': return val <= target;
                    case 'gt': return val > target;
                    case 'gte': return val >= target;
                    case 'eq': return val == target;
                    case 'ne': return val != target;
                    default: return false;
                }
            }
            // MP/Resource CHECK
            // 魔法值/资源检查
            else if (config.property === 'mp') {
                // Try common resource attributes
                const mp = actor.system.attributes?.mp || actor.system.attributes?.sp || actor.system.attributes?.focus;
                if (!mp) return false;
                
                let val = config.checkType === 'percent' ? (mp.value / mp.max * 100) : mp.value;
                let target = parseFloat(config.value);
                
                switch (config.operator) {
                    case 'lt': return val < target;
                    case 'lte': return val <= target;
                    case 'gt': return val > target;
                    case 'gte': return val >= target;
                    case 'eq': return val == target;
                    case 'ne': return val != target;
                    default: return false;
                }
            }
            // EFFECT CHECK
            // 效果检查
            else if (config.property === 'effect') {
                const search = config.value.toLowerCase();
                // Check effects (temporary and permanent)
                const hasEffect = actor.effects?.some(e => 
                    e.label?.toLowerCase().includes(search) || e.name?.toLowerCase().includes(search)
                );
                // Check status effects
                const hasStatus = actor.statuses?.has(config.value);
                
                return hasEffect || hasStatus;
            }
            // TURN CHECK
            // 回合检查
            else if (config.property === 'turn') {
                if (!game.combat || !game.combat.started) return false;
                const combatant = game.combat.combatant;
                return combatant && combatant.actorId === actor.id;
            }
            // COMBAT STATE CHECK
            // 战斗状态检查
            else if (config.property === 'combat') {
                return !!game.combat?.started;
            }
            
            return false;
        };
    }

    // Register core listener loop
    // 注册核心监听循环
    registerHooks() {
        // Listen for Actor updates (Health changes etc.)
        // 监听 Actor 更新 (血量变化等)
        Hooks.on('updateActor', (actor, changes, diff, userId) => {
            this.checkAuras("updateActor", actor);
        });

        // Listen for Token control changes (Aura should refresh when selecting different Tokens)
        // 监听 Token 控制权变化 (当你选中不同 Token 时，Aura 应该刷新)
        Hooks.on('controlToken', (token, controlled) => {
            const showHud = game.settings?.get('FoundryAuras','cooldowns.showHUD');
            if (controlled && token.actor) {
                this.checkAuras("controlToken", token.actor);
                // Render cooldown HUD for the newly controlled token's actor if enabled
                if (showHud) {
                    try { this.renderCooldownsHUD(token.actor); } catch (e) { /* ignore */ }
                }
            } else if (!controlled) {
                // If deselected, strictly clean up Auras for that Token (depending on logic)
                // For simplicity here, if no Token is currently controlled, hide all
                // 如果取消选中，通常清理针对该 Token 的 Aura (视逻辑而定)
                // 这里简单起见，如果当前没有控制任何 Token，可以隐藏
                if (!canvas.tokens.controlled.length) {
                    this.clearAll();
                    if (showHud) {
                        try { this.clearCooldownsHUD(); } catch (e) { /* ignore */ }
                    }
                }
            }
        });

        // Update HUD when cooldowns change
        Hooks.on('FoundryAuras.cooldownsUpdated', (actorId, cur) => {
            try {
                const showHud = game.settings?.get('FoundryAuras','cooldowns.showHUD');
                // If HUD is disabled, ensure it's cleared
                if (!showHud) return this.clearCooldownsHUD();
                // If the HUD is showing for this actor, refresh it
                if (this._cooldownHUDActorId === actorId) this.updateCooldownsHUD();
            } catch (e) { /* ignore */ }
        });
    }

    // Render a simple cooldowns HUD for the given actor
    renderCooldownsHUD(actor) {
        try {
            if (!actor) return this.clearCooldownsHUD();
            const hud = document.getElementById('foundry-auras-hud');
            if (!hud) return;
            let container = hud.querySelector('.fa-hud-cooldowns');
            if (!container) {
                container = document.createElement('div');
                container.className = 'fa-hud-cooldowns';
                container.style.position = 'absolute';
                container.style.top = '12px';
                container.style.right = '12px';
                container.style.pointerEvents = 'none';
                container.style.zIndex = '350';
                container.style.minWidth = '200px';
                container.style.background = 'rgba(0, 0, 0, 0.8)';
                container.style.border = '1px solid #333';
                container.style.borderRadius = '4px';
                container.style.padding = '10px';
                container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)';
                hud.appendChild(container);
            }
            container.innerHTML = '<div class="fa-hud-cooldowns-title" style="color:#ffcc00;margin-bottom:8px;font-size:14px;font-weight:bold;font-family:Consolas, monospace;">冷却时间</div><div class="fa-hud-cooldowns-list"></div>';
            this._cooldownHUDActorId = actor.id;
            // Ensure update loop
            if (!this._cooldownUpdateInterval) this._cooldownUpdateInterval = window.setInterval(() => this.updateCooldownsHUD(), 1000);
            this.updateCooldownsHUD();
        } catch (e) { console.warn('FoundryAuras | renderCooldownsHUD error', e); }
    }

    updateCooldownsHUD() {
        try {
            const container = document.querySelector('#foundry-auras-hud .fa-hud-cooldowns');
            if (!container) return;
            const list = container.querySelector('.fa-hud-cooldowns-list');
            list.innerHTML = '';
            const actorId = this._cooldownHUDActorId;
            if (!actorId) { container.style.display = 'none'; return; }
            const actor = game.actors.get(actorId);
            if (!actor) { container.style.display = 'none'; return; }
            const cd = actor.getFlag('FoundryAuras', 'cooldowns') || {};
            const now = Date.now();
            const entries = Object.entries(cd).map(([k,v]) => {
                if (typeof v === 'number') return [k, { expires: v, duration: 0 }];
                return [k, v];
            }).filter(([,v]) => v && v.expires && v.expires > now).sort((a,b) => a[1].expires - b[1].expires);
            if (!entries.length) { container.style.display = 'none'; return; }
            container.style.display = 'block';
            for (const [key, obj] of entries) {
                const remainingMs = Math.max(0, obj.expires - now);
                const dur = obj.duration || 0;
                const rem = Math.max(0, Math.ceil(remainingMs / 1000));
                // Compute precise percentage based on milliseconds to avoid jumpy ceil-based artifacts
                const pct = (dur > 0) ? Math.max(0, Math.min(100, (remainingMs / (dur * 1000)) * 100)) : 0;
                const item = document.createElement('div');
                item.className = 'fa-hud-cooldown-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '10px';
                item.style.marginBottom = '8px';
                item.style.pointerEvents = 'none';
                // If key indicates an item (item:Name), attempt to show the item's icon
                if (key.startsWith('item:')) {
                    const itemName = key.substring(5);
                    try {
                        const found = actor.items.find(i => (i.name === itemName) || (i.name?.toLowerCase() === itemName?.toLowerCase()));
                        if (found && found.img) {
                            const ico = document.createElement('div');
                            ico.className = 'fa-cooldown-icon';
                            ico.style.width = '24px';
                            ico.style.height = '24px';
                            ico.style.backgroundImage = `url('${found.img}')`;
                            ico.style.backgroundSize = 'cover';
                            ico.style.borderRadius = '4px';
                            ico.style.border = '1px solid #444';
                            ico.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.5)';
                            // Ensure icon is appended before text and bar so layout aligns
                            item.appendChild(ico);
                        }
                    } catch (e) { /* ignore */ }
                }
                const keyDiv = document.createElement('div');
                keyDiv.className = 'cd-key';
                // Clean up key display
                let displayKey = key;
                if (key.startsWith('item:')) {
                    displayKey = key.substring(5);
                }
                keyDiv.textContent = displayKey;
                keyDiv.style.color = '#ddd';
                keyDiv.style.fontSize = '12px';
                keyDiv.style.fontFamily = 'Consolas, monospace';
                keyDiv.style.flex = '1';
                keyDiv.style.minWidth = '0';
                keyDiv.style.whiteSpace = 'nowrap';
                keyDiv.style.overflow = 'hidden';
                keyDiv.style.textOverflow = 'ellipsis';
                const barWrapper = document.createElement('div');
                barWrapper.className = 'fa-progressbar-wrapper';
                barWrapper.style.width = '120px';
                barWrapper.style.pointerEvents = 'none';
                const bg = document.createElement('div'); 
                bg.className = 'fa-progress-bg'; 
                bg.style.background = '#222'; 
                bg.style.height = '14px';
                bg.style.borderRadius = '2px';
                bg.style.border = '1px solid #444';
                const fill = document.createElement('div'); 
                fill.className = 'fa-progress-fill'; 
                fill.style.width = pct + '%'; 
                fill.style.height = '100%'; 
                fill.style.background = '#ffcc00';
                fill.style.borderRadius = '1px';
                fill.style.boxShadow = '0 0 5px rgba(255, 204, 0, 0.5)';
                // Smooth transition: ensure transitions are applied when JS updates widths
                try { fill.style.transition = fill.style.transition || 'width 0.45s linear'; } catch(e) {}
                bg.appendChild(fill);
                const text = document.createElement('div'); 
                text.className = 'fa-bar-text'; 
                text.textContent = rem + 's'; 
                text.style.color = '#fff'; 
                text.style.fontSize = '11px';
                text.style.fontFamily = 'Consolas, monospace';
                text.style.textAlign = 'center';
                text.style.marginTop = '2px';
                barWrapper.appendChild(bg);
                barWrapper.appendChild(text);
                // Append key and bar after optional icon
                item.appendChild(keyDiv);
                item.appendChild(barWrapper);
                list.appendChild(item);
            }
        } catch (e) { /* ignore */ }
    }

    clearCooldownsHUD() {
        try {
            const container = document.querySelector('#foundry-auras-hud .fa-hud-cooldowns');
            if (container) container.remove();
            if (this._cooldownUpdateInterval) { clearInterval(this._cooldownUpdateInterval); this._cooldownUpdateInterval = null; }
            this._cooldownHUDActorId = null;
        } catch (e) { /* ignore */ }
    }

    // Request #1: Preview Mode Logic
    // 请求 #1: 预览模式逻辑
    setPreviewMode(enabled) {
        console.log(`FoundryAuras | setPreviewMode called with enabled: ${enabled}, this.auras:`, this.auras);
        this.previewMode = enabled;
        const hud = document.getElementById('foundry-auras-hud');
        if (hud) hud.innerHTML = ''; // Clear current // 清除当前
        
        if (enabled) {
            console.log("FoundryAuras | Calling forceShowAll");
            this.forceShowAll();
        } else {
            // Re-check normal conditions
            // 重新检查正常条件
            if (canvas.tokens && canvas.tokens.controlled[0]) {
                const actor = canvas.tokens.controlled[0].actor;
                // Re-run checks for all events to restore state properly
                // 重新运行所有事件的检查以正确恢复状态
                // Ideally strictly 'controlToken' is enough but let's be safe
                // 理想情况下仅 controlToken 足够，但为安全起见
                this.checkAuras("controlToken", actor);
            }
        }
    }

    forceShowAll() {
        let hud = document.getElementById('foundry-auras-hud');
        if (!hud) {
            console.log("FoundryAuras | HUD not found, creating it now");
            // Create HUD if it doesn't exist (fallback for timing issues)
            // 如果不存在则创建 HUD (处理时机问题)
            hud = document.createElement('div');
            hud.id = 'foundry-auras-hud';
            document.body.appendChild(hud);
        }
        console.log("FoundryAuras | forceShowAll: HUD ready, clearing content");
        hud.innerHTML = '';
        
        console.log(`FoundryAuras | forceShowAll: auras array has ${this.auras.length} items`);
        this.auras.forEach((aura, index) => {
            console.log(`FoundryAuras | Checking aura ${index}:`, {
                name: aura.name,
                id: aura.id,
                disabled: aura.disabled,
                type: aura.type,
                hasDisabledProp: aura.hasOwnProperty('disabled')
            });
            if (!aura.disabled) {
                console.log(`FoundryAuras | Calling showAura for: ${aura.name}`);
                this.showAura(aura, true);
            } else {
                console.log(`FoundryAuras | Skipping disabled aura: ${aura.name}`);
            }
        });
        console.log(`FoundryAuras | forceShowAll completed, HUD has ${hud.children.length} children`);
    }

    // Core check logic
    // 核心检查逻辑
    checkAuras(eventType, targetActor) {
        // If in preview mode, do not process normal triggers
        // 如果处于预览模式，不处理正常触发器
        if (this.previewMode) return;
        
        // Safety check for targetActor
        if (!targetActor) return;

        // For demonstration content, we only check the selected Token or User Character
        // Actual WA needs more complex "Load Conditions"
        // 为了演示方便，我们只检查选中的 Token 或 User Character
        // 实际 WA 需要更复杂的“载入条件” (Load Conditions)
        
        // Simple logic: Show Aura only for the currently selected Token
        // 简单的逻辑：只为当前当前选中的 Token 显示 Aura
        const controlled = canvas.tokens.controlled[0];
        if (!controlled || !controlled.actor || controlled.actor.id !== targetActor.id) return;

        for (const aura of this.auras) {
            // Check disabled
            // 检查是否禁用
            if (aura.disabled) continue;

            // 1. Check if trigger type matches
            // 1. 检查触发器类型是否匹配
            if (aura.trigger.event !== eventType && eventType !== "controlToken") continue;

            // 2. Run condition check
            // 2. 运行条件检查
            // Safely execute condition
            // 安全执行条件
            let shouldShow = false;
            let contextData = { actor: targetActor }; // Store context for display // 存储上下文用于显示

            // Resolve Token
            const token = targetActor.token?.object || canvas.tokens.placeables.find(t => t.actor?.id === targetActor.id);

            try {
                // If script mode returns object, use it as context
                // Pass Actor, Token, Game
                // 传入 Actor, Token, Game

                // Safeguard: Ensure condition is a function
                // 保护: 确保 condition 是一个函数
                if (typeof aura.condition !== 'function') {
                     // Try to re-compile if possible, or fallback
                     if (aura.conditionScript) {
                         try {
                             aura.condition = new Function("actor", "token", "game", aura.conditionScript);
                         } catch (err) {
                             console.error(`FoundryAuras | Failed to compile condition for ${aura.name}:`, err);
                             continue;
                         }
                     } else {
                         // No script, nothing to run
                         continue;
                     }
                }

                // Execute
                const result = aura.condition(targetActor, token, game);
                if (typeof result === 'object' && result !== null) {
                    shouldShow = result.show;
                    foundry.utils.mergeObject(contextData, result);
                } else {
                    shouldShow = result;
                }
            } catch(e) { console.error(e); }

            // 3. Update display state
            // 3. 更新显示状态
            if (shouldShow) {
                this.showAura(aura, false, contextData);
            } else {
                this.hideAura(aura.id);
            }
        }
    }

    // Helper: Parse dynamic string
    // 辅助：解析动态字符串
    parseText(text, context) {
        if (!text) return "";
        let out = text;
        
        // Actor standard values
        // Actor 标准值
        if (context.actor) {
            const sys = context.actor.system;
            const attr = sys.attributes || {};
            
            // HP
            const hp = attr.hp;
            if (hp) {
                out = out.replace(/%hp/g, hp.value);
                out = out.replace(/%maxhp/g, hp.max);
                out = out.replace(/%temp_hp/g, hp.temp || 0);

                if (hp.max > 0) {
                    const pct = Math.round((hp.value / hp.max) * 100);
                    out = out.replace(/%hp_pct/g, pct);
                } else {
                    out = out.replace(/%hp_pct/g, 0);
                }
            }

            // AC
            if (attr.ac) {
                out = out.replace(/%ac/g, attr.ac.value || 0);
            }

            // Movement
            if (attr.movement) {
                // dnd5e style
                out = out.replace(/%move/g, attr.movement.walk || 0);
            }

            // Name
            out = out.replace(/%name/g, context.actor.name);
        }

        // Custom script / Context values
        // 自定义脚本/上下文值
        if (context.val !== undefined) out = out.replace(/%val/g, context.val);
        if (context.max !== undefined) out = out.replace(/%max/g, context.max);
        if (context.stacks !== undefined) out = out.replace(/%stacks/g, context.stacks);
        if (context.duration !== undefined) out = out.replace(/%duration/g, context.duration);
        
        return out;
    }

    // Show Aura visual effect
    // 显示 Aura 视觉效果
    showAura(aura, isPreview = false, context = {}) {
        let hud = document.getElementById('foundry-auras-hud');
        if (!hud) {
            console.log("FoundryAuras | HUD not found in showAura, creating it");
            hud = document.createElement('div');
            hud.id = 'foundry-auras-hud';
            document.body.appendChild(hud);
        }
        let auraDiv;
        // Localize and Parse text
        // 本地化并解析文本
        const rawText = game.i18n.localize(aura.display.text);
        // Mock context for preview if missing
        // 如果缺少上下文，为预览模拟上下文
        if (isPreview && !context.actor) {
             // 提供 mock actor 数据，确保占位符能正常渲染，并满足常见条件
             context.actor = {
                 name: "预览角色",
                 isOwner: true, // 在预览模式下，模拟为玩家拥有的角色
                 system: {
                     attributes: {
                         hp: { value: 25, max: 100, temp: 0 }, // 设置为25/100，满足低生命值条件
                         ac: { value: 10 },
                         movement: { walk: 30 }
                     }
                 }
             };
        }
        const displayText = this.parseText(rawText, context);

        // Always create a new container when updating opacity
        // 当更新不透明度时，始终创建一个新容器
        // This ensures the opacity is applied correctly



        // Use mode-specific animation
        let animation = aura.display.animation;
        let animationOptions = aura.display.animationOptions || {};
        
        if (aura.display.mode === "icon") {
            animation = aura.display.iconAnimation || aura.display.animation;
            animationOptions = aura.display.iconAnimationOptions || aura.display.animationOptions || {};
        } else if (aura.display.mode === "text") {
            animation = aura.display.textAnimation || aura.display.animation;
            animationOptions = aura.display.textAnimationOptions || aura.display.animationOptions || {};
        } else if (aura.display.mode === "both") {
            animation = aura.display.bothAnimation || aura.display.animation;
            animationOptions = aura.display.bothAnimationOptions || aura.display.animationOptions || {};
        }
        
        // Create a container for the aura
        // 创建光环容器
        const container = document.createElement('div');
        container.style.position = 'absolute';
        // Ensure position values are not undefined
        // 确保位置值不为 undefined
        container.style.left = aura.display.posX || "50%";
        container.style.top = aura.display.posY || "50%";
        
        // Apply opacity to the container
        // 对容器应用不透明度
        if (aura.display.opacity !== undefined && aura.display.opacity !== null) container.style.opacity = aura.display.opacity;
        
        // Make container clickable
        // 让容器可点击
        container.style.pointerEvents = 'auto';
        container.style.display = 'inline-block';
        container.style.zIndex = '10';
        container.style.boxSizing = 'border-box';
        container.style.margin = '0';
        container.style.padding = '0';
        
        // Ensure the container has the same size as the auraDiv
        // 确保容器与光环元素大小相同
        container.style.width = 'auto';
        container.style.height = 'auto';
        container.style.overflow = 'visible';
        
        // Create the actual aura element with animation
        // 创建带有动画的实际光环元素
        auraDiv = document.createElement('div');
        auraDiv.id = `aura-${aura.id}`;
        auraDiv.className = `aura-display ${animation}`;
        auraDiv.style.position = 'static';
        auraDiv.style.left = '0';
        auraDiv.style.top = '0';
        auraDiv.style.margin = '0';
        auraDiv.style.padding = '0';
        auraDiv.style.boxSizing = 'border-box';
        if (aura.display.backgroundColor) auraDiv.style.backgroundColor = aura.display.backgroundColor;
        if (aura.display.borderColor) auraDiv.style.borderColor = aura.display.borderColor;
        if (aura.display.borderSize) auraDiv.style.borderWidth = aura.display.borderSize + 'px';
        if (aura.display.borderSize) auraDiv.style.borderStyle = 'solid';
        if (aura.display.shadowColor && aura.display.shadowSize) {
            auraDiv.style.boxShadow = `0 0 ${aura.display.shadowSize}px ${aura.display.shadowColor}`;
        }
        if (aura.display.rotation) auraDiv.style.transform = `rotate(${aura.display.rotation}deg)`;
        if (aura.display.scale && aura.display.scale !== 1) {
            const currentTransform = auraDiv.style.transform || '';
            auraDiv.style.transform = `${currentTransform} scale(${aura.display.scale})`.trim();
        }
        
        // Apply animation options as CSS variables
        // 应用动画选项作为CSS变量
        if (animationOptions) {
            if (animationOptions.flashSpeed) auraDiv.style.setProperty('--flash-speed', animationOptions.flashSpeed + 's');
            if (animationOptions.pulseSpeed) auraDiv.style.setProperty('--pulse-speed', animationOptions.pulseSpeed + 's');
            if (animationOptions.spinSpeed) auraDiv.style.setProperty('--spin-speed', animationOptions.spinSpeed + 's');
            if (animationOptions.bounceSpeed) auraDiv.style.setProperty('--bounce-speed', animationOptions.bounceSpeed + 's');
            if (animationOptions.shakeSpeed) auraDiv.style.setProperty('--shake-speed', animationOptions.shakeSpeed + 's');
            if (animationOptions.breathSpeed) auraDiv.style.setProperty('--breath-speed', animationOptions.breathSpeed + 's');
            if (animationOptions.glowSpeed) auraDiv.style.setProperty('--glow-speed', animationOptions.glowSpeed + 's');
            if (animationOptions.heartbeatSpeed) auraDiv.style.setProperty('--heartbeat-speed', animationOptions.heartbeatSpeed + 's');
        }
        
        if (isPreview) {
            auraDiv.classList.add('fa-preview');
        }

        // --- RENDER CONTENT BASED ON TYPE ---
        // --- 基于类型渲染内容 ---
        
        if (aura.type === 'progressbar') {
            auraDiv.classList.add('fa-progressbar-wrapper');
            // Ensure container class for CSS handles
            auraDiv.classList.add('foundry-aura-container');
            
            auraDiv.style.width = (aura.display.width || 200) + 'px';
            auraDiv.style.height = (aura.display.height || 40) + 'px';
            
            // Background
            // 背景
            const barBg = document.createElement('div');
            barBg.className = 'fa-progress-bg';
            barBg.style.backgroundColor = aura.display.barBgColor || '#333';
            barBg.style.width = '100%';
            barBg.style.height = '100%';

            // Fill
            // 填充
            const barFill = document.createElement('div');
            barFill.className = 'fa-progress-fill';
            barFill.style.backgroundColor = aura.display.barColor || '#f00';
            barFill.style.height = '100%';
            barFill.style.width = '100%'; 
            
            // Initial calc
            // 初始计算
            if (context.actor) {
                const hp = context.actor.system.attributes?.hp;
                 if (hp && hp.max > 0) {
                     const pct = Math.min(100, Math.max(0, (hp.value / hp.max) * 100));
                     barFill.style.width = `${pct}%`;
                 }
            } else if (isPreview) {
                // 在预览模式下，如果没有 actor，使用默认 100% 填充
                barFill.style.width = '100%';
            }

            // Overlay Text
            // 覆盖文本
            const barText = document.createElement('div');
            barText.className = 'aura-text fa-bar-text';
            barText.textContent = displayText;

            // Icon (Optional, left side)
            // 图标 (可选，左侧)
            const iconDiv = document.createElement('div');
            iconDiv.className = 'aura-icon fa-bar-icon';
            iconDiv.style.backgroundImage = `url('${aura.display.icon}')`;

            barBg.appendChild(barFill);
            auraDiv.appendChild(iconDiv); // Icon outside or inside? WA usually puts checking icon outside or generic icon. Let's put left.
            auraDiv.appendChild(barBg);
            auraDiv.appendChild(barText);

        } else {
            // Standard Icon/Text Mode
            // 标准图标/文本模式
            // Ensure container class
            auraDiv.classList.add('foundry-aura-container');
            
            // Apply size to container
            // 应用尺寸到容器
            if (aura.display.width) auraDiv.style.width = aura.display.width + 'px';
            if (aura.display.height) auraDiv.style.height = aura.display.height + 'px';
            
            // Image/Icon/Video - use mode-specific settings
            if (aura.display.mode === "both" || aura.display.mode === "icon") {
                const isVideo = aura.display.icon.toLowerCase().endsWith('.webm') || aura.display.icon.toLowerCase().endsWith('.mp4');
                let mediaEl;
                let iconWidth = aura.display.width;
                let iconHeight = aura.display.height;

                // Use mode-specific dimensions
                if (aura.display.mode === "icon") {
                    iconWidth = aura.display.iconWidth || aura.display.width;
                    iconHeight = aura.display.iconHeight || aura.display.height;
                } else if (aura.display.mode === "both") {
                    iconWidth = aura.display.bothWidth || aura.display.width;
                    iconHeight = aura.display.bothHeight || aura.display.height;
                }

                if (isVideo) {
                    mediaEl = document.createElement('video');
                    mediaEl.src = aura.display.icon;
                    // Attributes for autoplaying transparent webm
                    mediaEl.autoplay = true;
                    mediaEl.loop = true;
                    mediaEl.muted = true; 
                    mediaEl.style.backgroundColor = 'transparent';
                    mediaEl.classList.add('aura-icon');
                    // Apply size to media element
                    if (iconWidth) mediaEl.style.width = iconWidth + 'px';
                    if (iconHeight) mediaEl.style.height = iconHeight + 'px';
                    // Promise fix
                    mediaEl.play().catch(e=>{});
                    auraDiv.appendChild(mediaEl);
                } else {
                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'aura-icon';
                    iconDiv.style.backgroundImage = `url('${aura.display.icon}')`;
                    // Apply size to icon
                    if (iconWidth) iconDiv.style.width = iconWidth + 'px';
                    if (iconHeight) iconDiv.style.height = iconHeight + 'px';
                    auraDiv.appendChild(iconDiv);
                }
            }

            // Text - use mode-specific settings
            if (aura.display.mode === "both" || aura.display.mode === "text") {
                const textDiv = document.createElement('div');
                textDiv.className = 'aura-text';
                textDiv.textContent = displayText;
                // Apply font properties - use mode-specific settings
                let fontSize = aura.display.fontSize;
                let fontColor = aura.display.fontColor;

                if (aura.display.mode === "text") {
                    fontSize = aura.display.textFontSize || aura.display.fontSize;
                    fontColor = aura.display.textFontColor || aura.display.fontColor;
                } else if (aura.display.mode === "both") {
                    fontSize = aura.display.bothFontSize || aura.display.fontSize;
                    fontColor = aura.display.bothFontColor || aura.display.fontColor;
                }

                if (fontSize) textDiv.style.fontSize = fontSize + 'px';
                if (fontColor) textDiv.style.color = fontColor;
                auraDiv.appendChild(textDiv);
            }
        }

        this._attachInteraction(auraDiv, aura);
        
        // Add aura to container
        // 将光环添加到容器
        container.appendChild(auraDiv);
        
        // Append container to HUD
        // 将容器添加到 HUD
        hud.appendChild(container);
        
        // Store the container instead of the auraDiv
        // 存储容器而不是光环元素
        this.activeAuras.set(aura.id, container);
    }

    _attachInteraction(element, aura) {
        const managerOpen = !!document.getElementById('foundry-auras-manager');
        if (!managerOpen) return;

        // Don't attach interaction to preview auras - manager handles dragging
        // 不要为预览光环添加交互 - 管理器处理拖拽
        if (element.classList.contains('fa-preview')) return;

        element.classList.add('editable');

        // RESIZE HANDLE
        const handle = document.createElement('div');
        handle.className = 'foundry-aura-resize-handle';
        element.appendChild(handle);

        let isDragging = false;
        let isResizing = false;

        // Get the container element (parent of element)
        // 获取容器元素 (element 的父元素)
        const container = element.parentNode;

        // DRAG
        element.addEventListener('mousedown', (e) => {
            if (e.target === handle) return;
            if (e.button !== 0) return; // Left click only
            isDragging = true;
            e.preventDefault();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = container ? container.offsetLeft : element.offsetLeft;
            const startTop = container ? container.offsetTop : element.offsetTop;
            const parentW = container ? container.offsetParent.clientWidth : (element.offsetParent ? element.offsetParent.clientWidth : window.innerWidth);
            const parentH = container ? container.offsetParent.clientHeight : (element.offsetParent ? element.offsetParent.clientHeight : window.innerHeight);

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                
                if (container) {
                    container.style.left = (startLeft + dx) + 'px';
                    container.style.top = (startTop + dy) + 'px';
                } else {
                    element.style.left = (startLeft + dx) + 'px';
                    element.style.top = (startTop + dy) + 'px';
                }
            };

            const onMouseUp = () => {
                if (!isDragging) return;
                isDragging = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                
                // Update Inputs (Calc Percentage)
                const newLeft = container ? container.offsetLeft : element.offsetLeft;
                const newTop = container ? container.offsetTop : element.offsetTop;
                
                const pctX = ((newLeft / parentW) * 100).toFixed(1) + '%';
                const pctY = ((newTop / parentH) * 100).toFixed(1) + '%';
                
                this._updateManagerInput('display.posX', pctX);
                this._updateManagerInput('display.posY', pctY);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // RESIZE
        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isResizing = true;
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            const startW = element.getBoundingClientRect().width;
            const startH = element.getBoundingClientRect().height;

            const onMouseMove = (moveEvent) => {
                if (!isResizing) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                element.style.width = (startW + dx) + 'px';
                element.style.height = (startH + dy) + 'px';
            };

            const onMouseUp = () => {
                if (!isResizing) return;
                isResizing = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                const newW = element.style.width; // '200px'
                const newH = element.style.height;

                // Update mode-specific size fields
                const aura = this.auras.find(a => a.id === element.id.replace('aura-', ''));
                if (aura) {
                    if (aura.display.mode === 'icon') {
                        this._updateManagerInput('display.iconWidth', parseInt(newW));
                        this._updateManagerInput('display.iconHeight', parseInt(newH));
                    } else if (aura.display.mode === 'both') {
                        this._updateManagerInput('display.bothWidth', parseInt(newW));
                        this._updateManagerInput('display.bothHeight', parseInt(newH));
                    } else {
                        // Default to general width/height for text mode or fallback
                        this._updateManagerInput('display.width', parseInt(newW));
                        this._updateManagerInput('display.height', parseInt(newH));
                    }
                }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    _updateManagerInput(name, value) {
        const doc = document.getElementById('foundry-auras-manager');
        if (!doc) return;
        const input = doc.querySelector(`input[name="${name}"]`);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Highlight a specific aura in the HUD (for Manager interaction)
    // 在 HUD 中高亮特定光环 (用于管理器交互)
    highlightAura(id) {
         const hud = document.getElementById('foundry-auras-hud');
         if (!hud) return;
         
         const children = hud.children;
         for (let i = 0; i < children.length; i++) {
             const child = children[i];
             if (child.id === `aura-${id}`) {
                 child.classList.add('aura-selected');
                 // Ensure z-index boost
                 // 确保 z-index 提升
                 child.style.zIndex = 150; 
             } else {
                 child.classList.remove('aura-selected');
                 if (child.classList.contains('fa-preview')) {
                     child.style.zIndex = '';
                 }
             }
         }
    }

    // Hide Aura
    // 隐藏 Aura
    hideAura(auraId) {
        const el = document.getElementById(`aura-${auraId}`);
        if (el) el.remove();
        // Also remove from activeAuras map
        this.activeAuras.delete(auraId);
    }

    // Clear all Auras
    // 清除所有 Aura
    clearAll() {
        const hud = document.getElementById('foundry-auras-hud');
        if (hud) hud.innerHTML = '';
    }

    // New Preview Logic for Manager
    // 新的管理器预览逻辑
    previewAura(auraId) {
        // Always clear and show only the selected aura
        // 总是清空并只显示选中的光环
        this.previewMode = true;
        this.currentPreviewId = auraId;
        const aura = this.auras.find(a => a.id === auraId);
        if (!aura) {
            console.log(`FoundryAuras | previewAura: aura ${auraId} not found`);
            return;
        }

        // Clear HUD first to show only this one
        this.clearAll();

        // Show it in preview mode
        this.showAura(aura, true);
        
        // Highlight it (add selection border)
        this.highlightAura(auraId);
    }

    exitPreview() {
        this.previewMode = false;
        this.currentPreviewId = null;
        this.clearAll();
        // Restore normal state if tokens controls are active
        if (canvas.ready && canvas.tokens && canvas.tokens.controlled[0]) {
             this.checkAuras("controlToken", canvas.tokens.controlled[0].actor);
        }
    }
}

// 启动模块
const engine = new AuraEngine();
engine.init();
// Expose for Manager (Global Access)
globalThis.FoundryAuras = { engine };
