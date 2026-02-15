// FoundryAuras - Configuration Manager (The IDE UI)
// FoundryAuras - 配置管理器 (IDE 界面)
// V14 Compatibility: Uses foundry.utils for objects, avoids deprecated data patterns.
// V14 兼容性: 使用 foundry.utils 处理对象，避免使用弃用的 data 模式。

import { AURA_PRESETS } from "./presets.js";
import { API_DOCS } from "./api-docs.js";
import { CooldownsSettings } from "./cooldowns_settings.js";

export class AuraManager extends FormApplication {
    constructor(object, options) {
        super(object, options);
        this.selectedAuraId = null; // 跟踪选中的光环 ID
        this.activeTab = "display"; // 跟踪当前激活的选项卡
        this.previewInitialized = false; // 跟踪预览模式是否已初始化
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-auras-manager",
            title: game.i18n.localize("FOUNDRYAURAS.Manager.Title"),
            template: "modules/FoundryAuras/templates/manager.hbs",
            width: 900,
            height: 650, // Adjusted from 600 to 650 for better balance
            resizable: false, // Request #3: Fixed window
            classes: ["foundry-auras-manager"],
            closeOnSubmit: false,
            submitOnChange: true,
            zIndex: 500 // Below dialogs but above most applications
        });
    }

    getData() {
        let auras = game.settings.get("FoundryAuras", "auras") || [];
        
        // Fix duplicate IDs if any exist
        const seenIds = new Set();
        let hasDuplicates = false;
        auras = auras.map(aura => {
            if (seenIds.has(aura.id)) {
                console.warn(`FoundryAuras | Found duplicate ID: ${aura.id}, generating new ID for aura "${aura.name}"`);
                hasDuplicates = true;
                return {...aura, id: foundry.utils.randomID()};
            }
            seenIds.add(aura.id);
            return aura;
        });
        
        if (hasDuplicates) {
            console.log('FoundryAuras | Fixed duplicate IDs, saving corrected data');
            game.settings.set("FoundryAuras", "auras", auras);
        }
        
        // Request #7: Split into Loaded and Unloaded
        // We assume 'disabled' property controls loading state.
        const loadedAuras = auras.filter(a => !a.disabled);
        const unloadedAuras = auras.filter(a => a.disabled);

        const selectedAura = this.selectedAuraId ? auras.find(a => a.id === this.selectedAuraId) : null;
        // 为了让编辑器 UI 使用“速度（Hz）”语义来显示动画速度，我们创建一个用于模板渲染的副本
        // 内部存储仍然为持续时间（秒），但是 UI 显示为频率（Hz），保存时再反向映射回持续时间。
        let uiSelectedAura = null;
        if (selectedAura) {
            uiSelectedAura = foundry.utils.deepClone(selectedAura);
            if (uiSelectedAura.display && uiSelectedAura.display.animationOptions) {
                for (const k of Object.keys(uiSelectedAura.display.animationOptions)) {
                    // 仅处理以 Speed 结尾或 animationOptions 的数值字段
                    const val = parseFloat(uiSelectedAura.display.animationOptions[k]);
                    if (!isNaN(val) && val > 0) {
                        // 存储为持续时间（秒）时，UI 显示为频率 Hz = 1 / duration
                        uiSelectedAura.display.animationOptions[k] = (1 / val).toFixed(2);
                    } else {
                        uiSelectedAura.display.animationOptions[k] = uiSelectedAura.display.animationOptions[k];
                    }
                }
            }
        }
        
        console.log(`FoundryAuras | getData: auras.length=${auras.length}, loadedAuras.length=${loadedAuras.length}, selectedAuraId=${this.selectedAuraId}, selectedAura=${selectedAura ? selectedAura.name : 'null'}`);
        
        const triggerTypes = { 
            "event": game.i18n.localize("FOUNDRYAURAS.TriggerType.Event"),
            "timer": game.i18n.localize("FOUNDRYAURAS.TriggerType.Timer"),
            "combat": game.i18n.localize("FOUNDRYAURAS.TriggerType.Combat"),
            "status": game.i18n.localize("FOUNDRYAURAS.TriggerType.Status")
        }; 
        const events = { 
            "updateActor": game.i18n.localize("FOUNDRYAURAS.Event.UpdateActor"), 
            "controlToken": game.i18n.localize("FOUNDRYAURAS.Event.ControlToken"),
            // New Events support
            "updateCombat": game.i18n.localize("FOUNDRYAURAS.Event.UpdateCombat"), 
            "createActiveEffect": game.i18n.localize("FOUNDRYAURAS.Event.CreateActiveEffect"),
            "deleteActiveEffect": game.i18n.localize("FOUNDRYAURAS.Event.DeleteActiveEffect")
        }; 

        // New Dropdown Options
        const modes = {
            "simple": game.i18n.localize("FOUNDRYAURAS.Mode.Simple"),
            "script": game.i18n.localize("FOUNDRYAURAS.Mode.Script")
        };

        const targets = {
            "self": game.i18n.localize("FOUNDRYAURAS.Target.Self"),
            //"target": game.i18n.localize("FOUNDRYAURAS.Target.Target") // Not implemented in engine yet
        };

        // Dynamic simple properties based on trigger type and event
        // 根据触发类型和事件动态生成简单属性
        const getSimplePropsForTrigger = (triggerType, event) => {
            const baseProps = {
                "hp": game.i18n.localize("FOUNDRYAURAS.Prop.HP"),
                "effect": game.i18n.localize("FOUNDRYAURAS.Prop.Effect"),
                "turn": game.i18n.localize("FOUNDRYAURAS.Prop.Turn"),
                "combat": game.i18n.localize("FOUNDRYAURAS.Prop.CombatState")
            };

            switch (triggerType) {
                case "event":
                    switch (event) {
                        case "updateActor":
                            return {
                                "hp": baseProps.hp,
                                "effect": baseProps.effect
                            };
                        case "controlToken":
                            return {
                                "hp": baseProps.hp,
                                "effect": baseProps.effect,
                                "combat": baseProps.combat
                            };
                        case "updateCombat":
                            return {
                                "turn": baseProps.turn,
                                "combat": baseProps.combat
                            };
                        case "createActiveEffect":
                        case "deleteActiveEffect":
                            return {
                                "effect": baseProps.effect
                            };
                        default:
                            return baseProps;
                    }
                case "timer":
                    return {
                        "hp": baseProps.hp,
                        "effect": baseProps.effect,
                        "turn": baseProps.turn,
                        "combat": baseProps.combat
                    };
                case "combat":
                    return {
                        "turn": baseProps.turn,
                        "combat": baseProps.combat
                    };
                case "status":
                    return {
                        "hp": baseProps.hp,
                        "effect": baseProps.effect,
                        "combat": baseProps.combat
                    };
                default:
                    return baseProps;
            }
        };

        const simpleProps = getSimplePropsForTrigger(
            selectedAura?.trigger?.type || "event",
            selectedAura?.trigger?.event || "updateActor"
        );

        // NEW: Extended Animations
        const animations = {
            "none": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationNone"),
            "anim-pulse": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationPulse"),
            "anim-spin": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationSpin"),
            "anim-flash": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationFlash"),
            "anim-bounce": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationBounce"),
            "anim-shake": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationShake"),
            "anim-breath": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationBreath"),
            "anim-glow": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationGlow"),
            "anim-heartbeat": game.i18n.localize("FOUNDRYAURAS.Editor.AnimationHeartbeat")
        };

        const displayModes = {
            "both": game.i18n.localize("FOUNDRYAURAS.DisplayMode.Both"),
            "icon": game.i18n.localize("FOUNDRYAURAS.DisplayMode.Icon"),
            "text": game.i18n.localize("FOUNDRYAURAS.DisplayMode.Text")
        };

        const visualTypes = {
            "icon": game.i18n.localize("FOUNDRYAURAS.VisualType.Icon"),
            "progressbar": game.i18n.localize("FOUNDRYAURAS.VisualType.ProgressBar"),
            "text": game.i18n.localize("FOUNDRYAURAS.VisualType.Text")
        };

        const operators = {
            "lt": "<",
            "lte": "<=",
            "gt": ">",
            "gte": ">=",
            "eq": "==",
            "ne": "!=",
            "contains": "Contains"
        };

        const booleanOptions = {
            "true": game.i18n.localize("Yes") || "True",
            "false": game.i18n.localize("No") || "False"
        };

        const combatStates = {
            "in": game.i18n.localize("FOUNDRYAURAS.Combat.InCombat") || "In Combat",
            "out": game.i18n.localize("FOUNDRYAURAS.Combat.OutOfCombat") || "Out of Combat"
        };
        
        // Ensure defaults if missing
        // 确保缺失时的默认值
        if (selectedAura && !selectedAura.type) selectedAura.type = "icon";
        if (selectedAura && !selectedAura.display.barColor) selectedAura.display.barColor = "#ffcc00";
        if (selectedAura && !selectedAura.display.barBgColor) selectedAura.display.barBgColor = "#333333";
        if (selectedAura && !selectedAura.display.width) selectedAura.display.width = 200;
        if (selectedAura && !selectedAura.display.height) selectedAura.display.height = 40;
        if (selectedAura && !selectedAura.display.mode) selectedAura.display.mode = "both";
        if (selectedAura && !selectedAura.conditionMode) selectedAura.conditionMode = "script";
        if (selectedAura && !selectedAura.simpleCondition) {
            selectedAura.simpleCondition = { property: "hp", operator: "lt", value: "50", checkType: "percent" };
        }
        
        // Ensure display defaults
        // 确保显示默认值
        if (selectedAura && !selectedAura.display.posX) selectedAura.display.posX = "50%";
        if (selectedAura && !selectedAura.display.posY) selectedAura.display.posY = "50%";
        if (selectedAura && !selectedAura.display.fontSize) selectedAura.display.fontSize = 24;
        if (selectedAura && !selectedAura.display.fontColor) selectedAura.display.fontColor = "#ffffff";
        if (selectedAura && !selectedAura.display.opacity) selectedAura.display.opacity = 1;
        // Display mode specific defaults
        if (selectedAura && selectedAura.display.mode === "icon") {
            if (!selectedAura.display.iconWidth) selectedAura.display.iconWidth = 64;
            if (!selectedAura.display.iconHeight) selectedAura.display.iconHeight = 64;
            if (!selectedAura.display.iconAnimation) selectedAura.display.iconAnimation = "none";
            if (!selectedAura.display.iconAnimationOptions) selectedAura.display.iconAnimationOptions = {};
        } else if (selectedAura && selectedAura.display.mode === "text") {
            if (!selectedAura.display.textFontSize) selectedAura.display.textFontSize = 24;
            if (!selectedAura.display.textFontColor) selectedAura.display.textFontColor = "#ffffff";
            if (!selectedAura.display.textAnimation) selectedAura.display.textAnimation = "none";
            if (!selectedAura.display.textAnimationOptions) selectedAura.display.textAnimationOptions = {};
        } else if (selectedAura && selectedAura.display.mode === "both") {
            if (!selectedAura.display.bothWidth) selectedAura.display.bothWidth = 64;
            if (!selectedAura.display.bothHeight) selectedAura.display.bothHeight = 64;
            if (!selectedAura.display.bothFontSize) selectedAura.display.bothFontSize = 24;
            if (!selectedAura.display.bothFontColor) selectedAura.display.bothFontColor = "#ffffff";
            if (!selectedAura.display.bothAnimation) selectedAura.display.bothAnimation = "none";
            if (!selectedAura.display.bothAnimationOptions) selectedAura.display.bothAnimationOptions = {};
        }
        if (selectedAura && !selectedAura.display.fontColor) selectedAura.display.fontColor = "#ffffff";
        if (selectedAura && !selectedAura.display.opacity) selectedAura.display.opacity = 1;
        if (selectedAura && !selectedAura.display.animationOptions) selectedAura.display.animationOptions = {};
        if (selectedAura && !selectedAura.display.borderColor) selectedAura.display.borderColor = "";
        if (selectedAura && !selectedAura.display.borderSize) selectedAura.display.borderSize = 0;
        if (selectedAura && !selectedAura.display.backgroundColor) selectedAura.display.backgroundColor = "";
        if (selectedAura && !selectedAura.display.shadowColor) selectedAura.display.shadowColor = "";
        if (selectedAura && !selectedAura.display.shadowSize) selectedAura.display.shadowSize = 0;
        if (selectedAura && !selectedAura.display.rotation) selectedAura.display.rotation = 0;
        if (selectedAura && !selectedAura.display.scale) selectedAura.display.scale = 1;

        return {
            auras: auras, // Raw list if needed
            loadedAuras: loadedAuras,
            unloadedAuras: unloadedAuras,
            selectedAuraId: this.selectedAuraId,
            selectedAura: selectedAura,
            activeTab: this.activeTab,
            triggerTypes: triggerTypes,
            events: events,
            
            // New Options
            // 新选项
            modes: modes,
            targets: targets,
            visualTypes: visualTypes,
            simpleProps: simpleProps,
            operators: operators,
            booleanOptions: booleanOptions,
            combatStates: combatStates,
            animations: animations,
            displayModes: displayModes,
            
            // Helper Docs
            // 帮助文档
            apiDocs: API_DOCS,

            presets: AURA_PRESETS,
            isDisplayTab: this.activeTab === "display",
            isTriggerTab: this.activeTab === "trigger",
            isLoadTab: this.activeTab === "load"
            ,
            // Cooldowns context: 当前选中 token 的 actor 的冷却映射（供模板展示）
            cooldownsActorId: (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) ? canvas.tokens.controlled[0].actor?.id : (game.user.character?.id || null),
            cooldowns: (() => {
                try {
                    const aid = (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) ? canvas.tokens.controlled[0].actor?.id : (game.user.character?.id || null);
                    if (!aid) return {};
                    const actor = game.actors.get(aid);
                    if (!actor) return {};
                    return actor.getFlag('FoundryAuras','cooldowns') || {};
                } catch (e) { return {}; }
            })()
            ,
            // Whether to show cooldowns HUD (client setting)
            cooldownsShowHUD: game.settings.get('FoundryAuras','cooldowns.showHUD')
        };
    }

    // Request #1: Preview Mode Lifecycle
    // 请求 #1: 预览模式生命周期
    async _render(force, options) {
        await super._render(force, options);
        
        // Ensure auras are loaded before showing preview
        // 确保在显示预览之前加载 auras
        if (globalThis.FoundryAuras?.engine && (!globalThis.FoundryAuras.engine.auras || globalThis.FoundryAuras.engine.auras.length === 0)) {
            console.log("FoundryAuras | Auras not loaded yet, loading now");
            globalThis.FoundryAuras.engine.loadAuras();
        }
        
        // Don't automatically set preview mode - let individual aura selection handle it
        // 不要自动设置预览模式 - 让单个光环选择处理它
        // if (globalThis.FoundryAuras?.engine) {
        //     globalThis.FoundryAuras.engine.setPreviewMode(true);
        // }

        // Fix file picker integration is now handled in activateListeners
        // 文件选择器集成现在在activateListeners中处理
        // requestAnimationFrame(() => {
        //     this._fixFilePickers();
        // });
    }

    activateListeners(html) {
        super.activateListeners(html);
        const root = html[0];

        // Fix file picker integration after DOM is ready
        // 在DOM准备好后修复文件选择器集成
        // Only call once in setTimeout to avoid timing issues
        // 仅在setTimeout中调用一次以避免时机问题
        setTimeout(() => {
            this._fixFilePickers();
        }, 10);
        
        // Initialize preview mode only once
        // 只在第一次初始化预览模式
        if (!this.previewInitialized && globalThis.FoundryAuras?.engine) {
            this.previewInitialized = true;
            // Don't set preview mode here - let individual aura selection handle it
            // 不要在这里设置预览模式 - 让单个光环选择处理它
            // globalThis.FoundryAuras.engine.setPreviewMode(true);
        }

        // API Helper functionality (Search & Insert)
        // API 助手功能 (搜索与插入)
        const searchInput = root.querySelector('.fa-helper-search input');
        if (searchInput) {
            searchInput.addEventListener('input', ev => {
                const term = ev.target.value.toLowerCase();
                root.querySelectorAll('.fa-helper-item').forEach(el => {
                    const text = el.innerText.toLowerCase();
                    el.style.display = text.includes(term) ? 'block' : 'none';
                });
            });
        }

        root.querySelectorAll('.fa-helper-item').forEach(item => {
            item.addEventListener('click', ev => {
                const code = ev.currentTarget.dataset.code;
                const textarea = root.querySelector('textarea[name="conditionScript"]');
                if (textarea && code) {
                    // Try to insert at cursor
                    // 尝试在光标处插入
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    const before = text.substring(0, start);
                    const after = text.substring(end, text.length);
                    
                    textarea.value = before + code + after;
                    
                    // Restore cursor and focus
                    // 恢复光标和焦点
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = start + code.length;
                    
                    // Trigger change for submitOnChange
                    // 触发 submitOnChange 的变更事件
                    const event = new Event('change', { bubbles: true });
                    textarea.dispatchEvent(event);
                }
            });
        });

        // Item Selection
        // 项目选择

        // Cooldowns HUD toggle in sidebar
        const hudToggle = root.querySelector('.fa-cd-showhud');
        if (hudToggle) {
            hudToggle.addEventListener('change', async (ev) => {
                try {
                    const enabled = !!ev.target.checked;
                    await game.settings.set('FoundryAuras', 'cooldowns.showHUD', enabled);
                    // If enabling, render HUD for currently controlled actor
                    if (enabled) {
                        const aid = (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) ? canvas.tokens.controlled[0].actor : (game.user.character || null);
                        if (aid && globalThis.FoundryAuras?.engine) globalThis.FoundryAuras.engine.renderCooldownsHUD(aid);
                    } else {
                        if (globalThis.FoundryAuras?.engine) globalThis.FoundryAuras.engine.clearCooldownsHUD();
                    }
                } catch (e) { console.warn('Failed to set cooldowns.showHUD', e); }
            });
        }
        root.querySelectorAll('.fa-aura-item-content').forEach(item => {
            item.addEventListener('click', ev => {
                console.log('FoundryAuras | Click event triggered on aura item');
                // Prevent bubble if clicking controls
                // 点击控件时阻止冒泡
                if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'BUTTON' || ev.target.closest('button')) return;
                
                ev.preventDefault();
                // Find parent li
                // 查找父级 li 元素
                const li = ev.currentTarget.closest('.fa-aura-item');
                const newAuraId = li.dataset.id;
                console.log(`FoundryAuras | Clicked aura: ${newAuraId}, current selectedAuraId: ${this.selectedAuraId}`);
                console.log(`FoundryAuras | LI element:`, li);
                console.log(`FoundryAuras | LI dataset:`, li.dataset);
                
                // Check if there are multiple elements with the same data-id
                const allItemsWithSameId = root.querySelectorAll(`.fa-aura-item[data-id="${newAuraId}"]`);
                console.log(`FoundryAuras | Found ${allItemsWithSameId.length} elements with data-id="${newAuraId}"`);
                
                // Update selection and preview
                // 更新选择并预览
                if (this.selectedAuraId !== newAuraId) {
                    this.selectedAuraId = newAuraId;
                    console.log(`FoundryAuras | Updated selectedAuraId to: ${this.selectedAuraId}`);
                    // Preview the selected aura
                    // 预览选中的光环
                    if (globalThis.FoundryAuras?.engine) {
                        globalThis.FoundryAuras.engine.previewAura(newAuraId);
                    }
                    // Render the manager to show the editor panel
                    // 渲染管理器以显示编辑器面板
                    this.render();
                }
                
                // Don't render here - previewAura will update the HUD directly
                // 不要在这里渲染 - previewAura 会直接更新 HUD
                // this.render();
            });
        });

        // Tab Navigation
        // 标签页导航
        root.querySelectorAll('.fa-tab-item').forEach(tab => {
            tab.addEventListener('click', ev => {
                ev.preventDefault();
                this.activeTab = ev.currentTarget.dataset.tab;
                this.render();
            });
        });

        // Create From Preset
        // 从预设创建
        root.querySelectorAll('.fa-preset-item').forEach(btn => {
            btn.addEventListener('click', this._onCreateFromPreset.bind(this));
        });

        // Header Actions
        // 头部动作
        const helpBtn = root.querySelector('button[data-action="help"]');
        if (helpBtn) helpBtn.addEventListener('click', async (event) => {
             event.preventDefault();
             event.stopPropagation();
             
             // Dynamic Tour Construction
             // 动态构建引导
             const steps = [
                // Target header span instead of container to avoid click-through issues from the help button
                { id: "welcome", selector: ".fa-sidebar-header span", title: game.i18n.localize("FOUNDRYAURAS.Tour.Step1.Title"), content: game.i18n.localize("FOUNDRYAURAS.Tour.Step1.Content") },
                { id: "sidebar", selector: ".fa-sidebar", title: game.i18n.localize("FOUNDRYAURAS.Tour.Step2.Title"), content: game.i18n.localize("FOUNDRYAURAS.Tour.Step2.Content") }
             ];
             
                 if (root.querySelector('.fa-empty-state')) {
                 steps.push({ id: "presets", selector: ".fa-empty-state", title: game.i18n.localize("FOUNDRYAURAS.Tour.Step3.Title"), content: game.i18n.localize("FOUNDRYAURAS.Tour.Step3.Content") });
             }
             
             if (root.querySelector('textarea[name="conditionScript"]')) {
                 steps.push({ id: "editor", selector: ".fa-container", title: game.i18n.localize("FOUNDRYAURAS.Tour.Step4.Title"), content: game.i18n.localize("FOUNDRYAURAS.Tour.Step4.Content") });
             }
             
             if (root.querySelector('button[data-action="save"]')) {
                 steps.push({ id: "save", selector: "button[data-action='save']", title: game.i18n.localize("FOUNDRYAURAS.Tour.Step6.Title"), content: game.i18n.localize("FOUNDRYAURAS.Tour.Step6.Content") });
             }

             const tourData = {
                  title: game.i18n.localize("FOUNDRYAURAS.Tour.Title"),
                  description: game.i18n.localize("FOUNDRYAURAS.Tour.Description"),
                  canBeResumed: false,
                  display: true,
                  steps: steps
             };

             try {
                 const tour = new Tour(tourData);
                 // Delay slightly to prevent click-through
                 // 稍微延迟以防止点击穿透
                 await new Promise(resolve => setTimeout(resolve, 150));
                 tour.start();
             } catch(e) {
                 console.error("FoundryAuras | Tour Start Failed:", e);
                 ui.notifications.warn("Tour failed to start.");
             }
        });

        const cooldownsBtn = root.querySelector('button[data-action="cooldowns"]');
        if (cooldownsBtn) cooldownsBtn.addEventListener('click', (event) => {
            event.preventDefault();
            try {
                const app = new CooldownsSettings();
                app.render(true);
            } catch (e) {
                console.error('FoundryAuras | Failed to open Cooldowns settings', e);
                ui.notifications.error('无法打开 Cooldowns 设置');
            }
        });

        // Manager 内集成的 Cooldowns 面板交互
        const cdSetBtn = root.querySelector('button[data-action="cd-set"]');
        if (cdSetBtn) cdSetBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const keyInput = root.querySelector('input[name="cd-key-input"]');
            const secInput = root.querySelector('input[name="cd-seconds-input"]');
            const key = keyInput?.value?.trim();
            const seconds = Number(secInput?.value) || 0;
            if (!key || !seconds) return ui.notifications.warn('请提供有效的键与秒数');
            try {
                const actor = (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) ? canvas.tokens.controlled[0].actor : (game.user.character || null);
                if (!actor) return ui.notifications.warn('未找到 actor');
                await window.FoundryAuras?.Cooldowns?.setCooldown(actor, key, seconds);
                ui.notifications.info(`已为 ${actor.name} 设置 ${key} ${seconds}s 冷却`);
                this.render();
            } catch (e) { console.error(e); ui.notifications.error('设置冷却失败'); }
        });

        const cdPurgeBtn = root.querySelector('button[data-action="cd-purge"]');
        if (cdPurgeBtn) cdPurgeBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            try {
                await window.FoundryAuras?.Cooldowns?.purgeExpired();
                ui.notifications.info('已清理过期冷却');
                this.render();
            } catch (e) { console.error(e); ui.notifications.error('清理失败'); }
        });

        root.querySelectorAll('button[data-action="cd-clear"]').forEach(btn => {
            btn.addEventListener('click', async (ev) => {
                const key = ev.currentTarget.dataset.key;
                try {
                    const actor = (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) ? canvas.tokens.controlled[0].actor : (game.user.character || null);
                    if (!actor) return ui.notifications.warn('未找到 actor');
                    // 通过设置为 0 来清除
                    await window.FoundryAuras?.Cooldowns?.setCooldown(actor, key, 0);
                    ui.notifications.info(`已清除 ${key}`);
                    this.render();
                } catch (e) { console.error(e); ui.notifications.error('清除失败'); }
            });
        });

        const createBtn = root.querySelector('button[data-action="create"]');
        if (createBtn) createBtn.addEventListener('click', this._onCreateAura.bind(this));

        const importBtn = root.querySelector('button[data-action="import"]');
        if (importBtn) importBtn.addEventListener('click', this._onImportAura.bind(this));

        const exportAllBtn = root.querySelector('button[data-action="export-all"]');
        if (exportAllBtn) exportAllBtn.addEventListener('click', this._onExportAll.bind(this));

        // Footer Delete
        // 底部删除按钮
        const deleteBtn = root.querySelector('button[data-action="delete"]');
        if (deleteBtn) {
            // Remove existing listeners to prevent duplicates
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            newDeleteBtn.addEventListener('click', (event) => {
                this._onDeleteAura(event);
            });
        }

        // --- New Features Listeners ---
        // --- 新特性监听器 ---

        // Import Button (Moved to Header Actions block above, removing duplicate check if any)
        // 导入按钮 (已移至上方头部动作块，移除重复检查)

        // Rename (Input change)
        // 重命名 (输入改变)
        root.querySelectorAll('.fa-rename-input').forEach(input => {
            input.addEventListener('change', this._onRenameAura.bind(this));
            input.addEventListener('click', e => e.stopPropagation()); // Stop selection
        });

        // Duplicate
        // 复制
        root.querySelectorAll('button[data-action="duplicate"]').forEach(btn => {
            btn.addEventListener('click', this._onDuplicateAura.bind(this));
        });

        // Toggle Load
        // 切换载入状态
        root.querySelectorAll('button[data-action="toggle-load"]').forEach(btn => {
            btn.addEventListener('click', this._onToggleLoad.bind(this));
        });

        // Export
        // 导出
        root.querySelectorAll('button[data-action="export"]').forEach(btn => {
            btn.addEventListener('click', this._onExportAura.bind(this));
        });

        // Manual Save Buttons
        // 手动保存按钮
        const saveBtn = root.querySelector('button[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', this._onManualSave.bind(this));
        }

        const saveScriptBtn = root.querySelector('button[data-action="save-script"]');
        if (saveScriptBtn) {
            saveScriptBtn.addEventListener('click', this._onManualSaveScript.bind(this));
        }

        // Audio feature removed - no bindings

        // Dynamic simple properties update when trigger type/event changes
        // 当触发器类型/事件改变时动态更新简单属性
        const triggerTypeSelect = root.querySelector('select[name="trigger.type"]');
        const triggerEventSelect = root.querySelector('select[name="trigger.event"]');

        const updateSimpleProps = () => {
            // Simple approach: just re-render when trigger changes
            // 简单方法：当触发器改变时直接重新渲染
            this.render();
        };

        if (triggerTypeSelect) {
            triggerTypeSelect.addEventListener('change', updateSimpleProps);
        }
        if (triggerEventSelect) {
            triggerEventSelect.addEventListener('change', updateSimpleProps);
        }

        // Fix file picker integration after render
        // 在渲染后修复文件选择器集成
        const fixFilePickers = () => {
            // Find all flexrow containers with file pickers
            // 查找所有包含文件选择器的flexrow容器
            const flexrows = this.element?.querySelectorAll('.fa-settings-panel .flexrow') || [];
            flexrows.forEach(flexrow => {
                const input = flexrow.querySelector('input[type="text"]');
                const filePicker = flexrow.querySelector('button.file-picker');

                if (input && filePicker) {
                    // Ensure the flexrow has relative positioning
                    // 确保flexrow有相对定位
                    flexrow.style.position = 'relative';

                    // Ensure input has padding for the button
                    // 确保输入框有按钮的空间
                    input.style.paddingRight = '32px';
                    input.style.boxSizing = 'border-box';

                    // Position the file picker button absolutely
                    // 绝对定位文件选择器按钮
                    filePicker.style.position = 'absolute';
                    filePicker.style.right = '0';
                    filePicker.style.top = '0';
                    filePicker.style.bottom = '0';
                    filePicker.style.width = '32px';
                    filePicker.style.height = 'auto';
                    filePicker.style.background = '#222';
                    filePicker.style.border = '1px solid #555';
                    filePicker.style.borderLeft = 'none';
                    filePicker.style.color = '#ffcc00';
                    filePicker.style.cursor = 'pointer';
                    filePicker.style.display = 'flex';
                    filePicker.style.alignItems = 'center';
                    filePicker.style.justifyContent = 'center';
                    filePicker.style.borderRadius = '0 3px 3px 0';
                    filePicker.style.padding = '0';
                    filePicker.style.zIndex = '2';
                }
            });
        };

        // Apply fixes immediately and after any render
        // 立即应用修复，并在任何渲染后应用
        // this._fixFilePickers(); // Removed to prevent timing issues

        // Request #3: Drag & Drop for Preview
        // 请求 #3: 预览模式下的拖拽 (在 Manager 打开时生效)
        const hud = document.getElementById('foundry-auras-hud');
        if (hud) {
            hud.onmousedown = (e) => {
                 const target = e.target.closest('.aura-display.fa-preview');
                 if (!target) return;
                 
                 e.preventDefault(); 
                 e.stopPropagation();

                 const auraId = target.id.replace('aura-', '');
                 
                 // Update selection immediately if not already selected, but don't render yet
                 // 如果还没选中，立即更新选择，但暂时不渲染
                 const wasSelected = this.selectedAuraId === auraId;
                 if (!wasSelected) {
                     this.selectedAuraId = auraId;
                     // Preview the selected aura to ensure only this one is shown
                     // 预览选中的光环，确保只显示这一个
                     if (globalThis.FoundryAuras?.engine) {
                         globalThis.FoundryAuras.engine.previewAura(auraId);
                     }
                 }

                 // Drag logic
                 // 拖拽逻辑
                 const startX = e.clientX;
                 const startY = e.clientY;
                 
                 // Get current position from element properties
                 // 从元素属性获取当前位置
                 const currentLeft = target.offsetLeft || 0;
                 const currentTop = target.offsetTop || 0;
                 
                 const offsetX = startX - currentLeft;
                 const offsetY = startY - currentTop;

                 const onMouseMove = (moveEvent) => {
                     const newLeft = moveEvent.clientX - offsetX;
                     const newTop = moveEvent.clientY - offsetY;
                     target.style.left = newLeft + 'px';
                     target.style.top = newTop + 'px';
                 };

                 const onMouseUp = async (upEvent) => {
                     document.removeEventListener('mousemove', onMouseMove);
                     document.removeEventListener('mouseup', onMouseUp);
                     
                     // Save new position first
                     // 先保存新位置
                     const finalLeft = target.style.left;
                     const finalTop = target.style.top;
                     
                     const auras = game.settings.get("FoundryAuras", "auras");
                     const aura = auras.find(a => a.id === auraId);
                     if (aura) {
                         aura.display.posX = finalLeft;
                         aura.display.posY = finalTop;
                         await game.settings.set("FoundryAuras", "auras", auras);
                         // Settings change will trigger HUD recreation, but position is now saved
                         // 设置变更会触发HUD重新创建，但位置已经保存
                     }
                     
                     // No need to render - drag operation updated the aura position directly
                     // 无需渲染 - 拖拽操作直接更新了光环位置
                     // this.render();
                 };

                 document.addEventListener('mousemove', onMouseMove);
                 document.addEventListener('mouseup', onMouseUp);
            };
        }
    }

    // Audio feature removed

    /* --- Action Handlers --- */
    /* --- 动作处理器 --- */

    async _onRenameAura(event) {
        event.preventDefault();
        const input = event.currentTarget;
        const auraId = input.dataset.id;
        const newName = input.value;

        let auras = game.settings.get("FoundryAuras", "auras");
        const aura = auras.find(a => a.id === auraId);
        if (aura) {
            aura.name = newName;
            await game.settings.set("FoundryAuras", "auras", auras);
            // Don't full render if just renaming? Actually render is safer to update right pane
            // 仅重命名时不完全渲染？实际上重新渲染更安全以更新右侧面板
            if (this.selectedAuraId === auraId) this.render();
        }
    }

    async _onDuplicateAura(event) {
        event.stopPropagation();
        const auraId = event.currentTarget.dataset.id;
        let auras = game.settings.get("FoundryAuras", "auras");
        const original = auras.find(a => a.id === auraId);
        
        if (original) {
            const copy = foundry.utils.deepClone(original);
            copy.id = foundry.utils.randomID();
            copy.name = original.name + game.i18n.localize("FOUNDRYAURAS.Common.CopySuffix");
            auras.push(copy);
            await game.settings.set("FoundryAuras", "auras", auras);
            this.selectedAuraId = copy.id;
            this.render();
        }
    }

    async _onCreateAura(event) {
        if(event) event.preventDefault();
        
        const newAura = {
            id: foundry.utils.randomID(),
            name: "New Aura",
            type: "icon",
            disabled: false, 
            triggerMode: "simple",
            simpleCondition: { prop: "hp", operator: "lte", value: "50", percent: true },
            conditionScript: "return true;",
            trigger: { event: "updateActor", target: "self" },
            display: {
                mode: "both",
                icon: "icons/svg/mystery-man.svg",
                text: "Low HP!",
                posX: "50%", posY: "50%",
                width: 64, height: 64,
                opacity: 1,
                fontSize: 24, fontColor: "#ffffff",
                animation: "none"
            }
        };

        const auras = game.settings.get("FoundryAuras", "auras") || [];
        auras.push(newAura);
        await game.settings.set("FoundryAuras", "auras", auras);
        
        this.selectedAuraId = newAura.id;
        
        // Preview the new aura immediately
        // 立即预览新光环
        if (globalThis.FoundryAuras?.engine) {
            globalThis.FoundryAuras.engine.previewAura(newAura.id);
        }
        
        this.render();
    }

    async _onToggleLoad(event) {
        event.stopPropagation();
        const auraId = event.currentTarget.dataset.id;
        let auras = game.settings.get("FoundryAuras", "auras");
        const aura = auras.find(a => a.id === auraId);
        
        if (aura) {
            aura.disabled = !aura.disabled;
            await game.settings.set("FoundryAuras", "auras", auras);
            this.render();
        }
    }

    async _onManualSave(event) {
        event.preventDefault();
        // Force submit form to ensure all data is captured
        // 强制提交表单以确保捕获所有数据
        // Since submitOnChange is true, data should be synced, but let's be sure.
        // 由于 submitOnChange 为 true，数据应该已同步，但为了保险起见。
        if (this.selectedAuraId) {
             ui.notifications.info(game.i18n.localize("FOUNDRYAURAS.Editor.Save") + " - " + game.i18n.format("SETTINGS.Saved"));
             // We can also force a re-render if needed, but usually not required.
        }
    }

    async _onManualSaveScript(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // The textarea blur event handles the actual saving via _updateObject
        // text area 的 blur 事件通过 _updateObject 处理实际保存
        // We just need to give visual feedback
        // 我们只需要提供视觉反馈
        
        // Find the textarea and force blur if it has focus (to trigger change)
        // 查找 textarea，如果它有焦点则强制失去焦点 (以触发更改)
        const textarea = this.element[0].querySelector('textarea[name="conditionScript"]');
        if (textarea && document.activeElement === textarea) {
            textarea.blur();
            // Optional: Refocus? Maybe not, to indicate saved state.
        }

        ui.notifications.info(game.i18n.localize("FOUNDRYAURAS.Editor.SaveScript") + " - OK");
    }

    async _onExportAura(event) {
        event.stopPropagation();
        const auraId = event.currentTarget.dataset.id;
        const auras = game.settings.get("FoundryAuras", "auras");
        const aura = auras.find(a => a.id === auraId);
        
        if (aura) {
            const json = JSON.stringify(aura);
            // Simple Base64 encoding. 
            // In WA this is usually compressed, but for this simple module Base64 is fine.
            // 简单的 Base64 编码。
            // 在 WA 中通常会压缩，但对于此简单模组，Base64 已足够。
            const wastring = "!FA:" + btoa(unescape(encodeURIComponent(json)));
            
            // Output to dialog or clipboard
            // 输出到对话框或剪贴板
            const content = `<textarea style="width:100%; height: 200px; background:#111; color:#eee;">${wastring}</textarea>`;
            new Dialog({
                title: game.i18n.localize("FOUNDRYAURAS.Manager.Export"),
                content: content,
                buttons: {
                        copy: {
                            label: "Copy",
                            callback: html => {
                                // Foundry may pass a jQuery-wrapped html; 解包为原生元素
                                const root = html instanceof HTMLElement ? html : html[0];
                                const params = root.querySelector("textarea").value;
                                game.clipboard.copyPlainText(params);
                                ui.notifications.info("Copied to clipboard");
                            }
                        }
                }
            }, { zIndex: 1500 }).render(true);
        }
    }

    async _onExportAll(event) {
        event.preventDefault();
        const auras = game.settings.get("FoundryAuras", "auras") || [];
        if (!auras.length) return ui.notifications.warn("No auras to export");

        const json = JSON.stringify(auras);
        const wastring = "!FA:" + btoa(unescape(encodeURIComponent(json)));

        const content = `<textarea style="width:100%; height: 200px; background:#111; color:#eee;">${wastring}</textarea>`;
        new Dialog({
            title: game.i18n.localize("FOUNDRYAURAS.Manager.ExportAll"),
            content: content,
            buttons: {
                        copy: {
                            label: "Copy",
                            callback: html => {
                                const root = html instanceof HTMLElement ? html : html[0];
                                const params = root.querySelector("textarea").value;
                                game.clipboard.copyPlainText(params);
                                ui.notifications.info("Copied all auras to clipboard");
                            }
                        }
            }
        }, { zIndex: 1500 }).render(true);
    }

    async _onImportAura(event) {
        event.preventDefault();
        new Dialog({
            title: game.i18n.localize("FOUNDRYAURAS.Manager.Import"),
            content: `<textarea id="fa-import-text" style="width:100%; height: 200px; background:#111; color:#eee;" placeholder="Paste string here (!FA:...)"></textarea>`,
            buttons: {
                import: {
                    label: "Import",
                    callback: async html => {
                        const root = html instanceof HTMLElement ? html : html[0];
                        const str = root.querySelector("#fa-import-text").value.trim();
                        
                        if (!str.startsWith("!FA:")) {
                            return ui.notifications.error("Invalid String Format (Must start with !FA:)");
                        }
                        try {
                            const b64 = str.substring(4);
                            const json = decodeURIComponent(escape(atob(b64)));
                            const data = JSON.parse(json);
                            
                            let auras = game.settings.get("FoundryAuras", "auras") || [];
                            let importCount = 0;

                            // Handle Array (Export All) vs Object (Single Export)
                            // 处理数组 (导出所有) vs 对象 (单个导出)
                            const dataList = Array.isArray(data) ? data : [data];

                            for (let item of dataList) {
                                // Basic validation
                                if (!item.name || !item.display) continue;

                                // Assign new ID to avoid collisions
                                item.id = foundry.utils.randomID();
                                auras.push(item);
                                importCount++;
                            }

                            if (importCount > 0) {
                                await game.settings.set("FoundryAuras", "auras", auras);
                                this.selectedAuraId = auras[auras.length - 1].id; // Select last imported
                                this.render();
                                ui.notifications.info(`Imported ${importCount} Auras`);
                            } else {
                                ui.notifications.warn("No valid auras found in import.");
                            }
                        } catch (e) {
                            console.error(e);
                            ui.notifications.error("Import Failed: " + e.message);
                        }
                    }
                }
            }
        }, { zIndex: 1500 }).render(true);
    }

    async _updateObject(event, formData) {
        if (!this.selectedAuraId) return;
        // 首先把 UI 提交的 animation speed (Hz) 转换回内部使用的 duration (秒)
        for (const key of Object.keys(formData)) {
            // 仅处理 display.animationOptions.* 字段
            if (key.startsWith('display.animationOptions.')) {
                const v = parseFloat(formData[key]);
                if (!isNaN(v)) {
                    // 防止除零或非常小的值
                    const speed = Math.max(v, 0.01);
                    const duration = 1 / speed;
                    formData[key] = String(duration);
                }
            }
        }

        let auras = game.settings.get("FoundryAuras", "auras");
        const index = auras.findIndex(a => a.id === this.selectedAuraId);
        if (index === -1) return;

        // formData 是扁平对象 (例如 "display.text": "value")，需要先展开
        const expanded = foundry.utils.expandObject(formData);
        
        // 将变更合并到现有对象中
        foundry.utils.mergeObject(auras[index], expanded);

        await game.settings.set("FoundryAuras", "auras", auras);
        
        // Reload auras in the engine to reflect changes immediately in preview
        // 重新加载引擎中的光环，使预览立即反映更改
        if (globalThis.FoundryAuras?.engine) {
            globalThis.FoundryAuras.engine.loadAuras();
            // If we're in preview mode for this aura, update the preview
            // 如果我们正在预览这个光环，更新预览
            if (globalThis.FoundryAuras.engine.currentPreviewId === this.selectedAuraId) {
                globalThis.FoundryAuras.engine.previewAura(this.selectedAuraId);
            }
        }
        
        // 这里不需要主动 render，submitOnChange 机制通常会处理，且防止打断输入焦点
    }

    async _onCreateFromPreset(event) {
        event.preventDefault();
        const presetId = event.currentTarget.dataset.preset;
        const preset = AURA_PRESETS.find(p => p.id === presetId);
        
        if (!preset) return;

        // Clone data to avoid reference issues
        // 克隆数据以避免引用问题
        const newAura = foundry.utils.deepClone(preset.data);
        newAura.id = foundry.utils.randomID();
        // 如果名字是本地化键，尝试本地化（虽然 presets.js 里目前是硬编码英文name，但逻辑上支持）
        // 这里我们简单处理，保留预设名称
        
        let auras = game.settings.get("FoundryAuras", "auras") || [];
        auras.push(newAura);
        await game.settings.set("FoundryAuras", "auras", auras);
        
        this.selectedAuraId = newAura.id;
        this.render();
    }

    async _onCreateAura(event) {
        // Fallback to empty preset
        // 回退到空白预设
        event.preventDefault();
        const emptyPreset = AURA_PRESETS.find(p => p.id === "empty");
        const newAura = foundry.utils.deepClone(emptyPreset.data);
        newAura.id = foundry.utils.randomID();
        newAura.name = game.i18n.localize("FOUNDRYAURAS.Manager.New") + " " + game.i18n.localize("FOUNDRYAURAS.Common.Name");

        let auras = game.settings.get("FoundryAuras", "auras") || [];
        auras.push(newAura);
        await game.settings.set("FoundryAuras", "auras", auras);
        
        this.selectedAuraId = newAura.id;
        this.render();
    }

    async _onDeleteAura(event) {
        console.log('FoundryAuras | Delete button clicked, event:', event);
        console.log('FoundryAuras | selectedAuraId:', this.selectedAuraId);
        event.preventDefault();
        if (!this.selectedAuraId) {
            console.log('FoundryAuras | No selectedAuraId, returning');
            return;
        }

        const auras = game.settings.get("FoundryAuras", "auras") || [];
        const auraToDelete = auras.find(a => a.id === this.selectedAuraId);
        if (!auraToDelete) return;
        
        // Show confirmation dialog
        const confirmed = await new Promise((resolve) => {
            new Dialog({
                title: game.i18n.localize("FOUNDRYAURAS.Manager.DeleteConfirmTitle"),
                content: `<p>${game.i18n.localize("FOUNDRYAURAS.Manager.DeleteConfirmMessage").replace("{name}", auraToDelete.name)}</p>`,
                buttons: {
                    yes: {
                        label: game.i18n.localize("Yes") || "Yes",
                        callback: () => resolve(true)
                    },
                    no: {
                        label: game.i18n.localize("No") || "No",
                        callback: () => resolve(false)
                    }
                },
                default: "no"
            }, { zIndex: 1500 }).render(true); // Higher than FA interface
        });
        
        console.log('FoundryAuras | Delete confirmation result:', confirmed);
        
        if (!confirmed) {
            console.log('FoundryAuras | Delete cancelled by user');
            return;
        }
        
        console.log('FoundryAuras | User confirmed deletion, proceeding...');
        
        // Proceed with deletion
        console.log('FoundryAuras | Proceeding with deletion of aura:', auraToDelete.name);
        const updatedAuras = auras.filter(a => a.id !== this.selectedAuraId);
        console.log('FoundryAuras | Auras before deletion:', auras.length, 'after:', updatedAuras.length);
        await game.settings.set("FoundryAuras", "auras", updatedAuras);
        
        this.selectedAuraId = null;
        console.log('FoundryAuras | Deletion completed, re-rendering');
        this.render();
    }

    async close(options) {
        // Disable Preview Mode on close
        // 关闭时禁用预览模式
        if (globalThis.FoundryAuras?.engine) {
            globalThis.FoundryAuras.engine.exitPreview();
        }
        return super.close(options);
    }

    // Fix file picker integration
    // 修复文件选择器集成
    _fixFilePickers() {
        const applyFix = (rootEl) => {
            const flexrows = (rootEl || this.element[0]).querySelectorAll('.fa-settings-panel .flexrow') || [];
            flexrows.forEach(flexrow => {
                const input = flexrow.querySelector('input[type="text"]') || flexrow.querySelector('input');
                // Prefer the rendered button inside file-picker, but accept <file-picker> custom element too
                let filePickerEl = null;
                const fp = flexrow.querySelector('file-picker');
                if (fp) {
                    // file-picker may render an internal button; prefer that
                    const innerBtn = fp.querySelector('button');
                    filePickerEl = innerBtn || fp;
                } else {
                    filePickerEl = flexrow.querySelector('button.file-picker') || flexrow.querySelector('button.filepicker') || flexrow.querySelector('button.browseTooltip');
                }

                if (input && filePickerEl) {
                    try {
                        flexrow.style.position = flexrow.style.position || 'relative';
                        input.style.boxSizing = 'border-box';

                        // If this flexrow contains audio control buttons after the file-picker,
                        // keep the file-picker inline (static) so it doesn't overlap those buttons.
                        const hasAudioButtons = !!(flexrow.querySelector('.fa-audio-play') || flexrow.querySelector('.fa-audio-clear'));
                        if (hasAudioButtons) {
                            // Inline layout: give small spacing so buttons don't touch
                            filePickerEl.style.position = filePickerEl.style.position || 'static';
                            filePickerEl.style.marginLeft = filePickerEl.style.marginLeft || '6px';
                            filePickerEl.style.marginRight = filePickerEl.style.marginRight || '6px';
                            // Ensure input leaves room for file-picker visually
                            input.style.paddingRight = input.style.paddingRight || '8px';
                            filePickerEl.style.zIndex = filePickerEl.style.zIndex || '3';
                        } else {
                            // Default form-row with only input+picker: absolute position to the right of input
                            input.style.paddingRight = input.style.paddingRight || '36px';
                            filePickerEl.style.position = 'absolute';
                            filePickerEl.style.right = '0';
                            filePickerEl.style.top = '0';
                            filePickerEl.style.bottom = '0';
                            filePickerEl.style.width = filePickerEl.style.width || '36px';
                            filePickerEl.style.height = filePickerEl.style.height || '32px';
                            filePickerEl.style.display = 'flex';
                            filePickerEl.style.alignItems = 'center';
                            filePickerEl.style.justifyContent = 'center';
                            filePickerEl.style.background = filePickerEl.style.background || '#222';
                            filePickerEl.style.border = filePickerEl.style.border || '1px solid #555';
                            filePickerEl.style.borderLeft = filePickerEl.style.borderLeft || 'none';
                            filePickerEl.style.color = filePickerEl.style.color || '#ffcc00';
                            filePickerEl.style.cursor = 'pointer';
                            filePickerEl.style.zIndex = filePickerEl.style.zIndex || '5';
                        }
                    } catch (e) {
                        console.warn('FoundryAuras | _fixFilePickers failed for an element', e);
                    }
                }
            });
        };

        // Apply immediately and again shortly after to handle Foundry moving nodes
        try {
            applyFix(this.element[0]);
            setTimeout(() => applyFix(this.element[0]), 50);
            setTimeout(() => applyFix(this.element[0]), 250);
        } catch (e) {
            console.warn('FoundryAuras | _fixFilePickers execution error', e);
        }
    }
}
