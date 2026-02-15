// FoundryAuras - Preset Definitions
// FoundryAuras - 预设模版定义
// 为用户提供开箱即用的 FVTT 常用光环配置
// Provide out-of-the-box FVTT presets for common aura configurations

export const AURA_PRESETS = [
    {
        id: "empty",
        name: "FOUNDRYAURAS.Preset.Empty",
        description: "FOUNDRYAURAS.Preset.EmptyDesc",
        icon: "icons/svg/mystery-man.svg",
        data: {
            name: "New Aura",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: "return true;",
            display: { 
                icon: "icons/svg/mystery-man.svg", 
                text: "Text", 
                posX: "50%", 
                posY: "50%", 
                animation: "none", 
                animationOptions: {},
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#ffffff",
                opacity: 1,
                borderColor: "",
                borderSize: 0,
                backgroundColor: "",
                shadowColor: "",
                shadowSize: 0,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "low-hp",
        name: "FOUNDRYAURAS.Preset.LowHP",
        description: "FOUNDRYAURAS.Preset.LowHPDesc",
        icon: "icons/svg/blood.svg",
        data: {
            name: "Low Health Alert",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: `// Check if HP is below 20%
// 检查生命值是否低于 20%
// Supports dnd5e, pf2e and basic systems
// 支持 dnd5e, pf2e 和基础系统
const attributes = actor.system.attributes || {};
const hp = attributes.hp;

if (!hp) return false;
if (typeof hp.value !== 'number' || typeof hp.max !== 'number') return false;
if (hp.max === 0) return false;

return (hp.value / hp.max) <= 0.2;`,
            display: { 
                icon: "icons/svg/blood.svg", 
                text: "LOW HP!", 
                posX: "50%", 
                posY: "50%", 
                animation: "anim-pulse", 
                animationOptions: { pulseSpeed: 1.5 },
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#ffffff",
                opacity: 1,
                borderColor: "",
                borderSize: 0,
                backgroundColor: "",
                shadowColor: "",
                shadowSize: 0,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "turn-start",
        name: "FOUNDRYAURAS.Preset.MyTurn",
        description: "FOUNDRYAURAS.Preset.MyTurnDesc",
        icon: "icons/svg/combat.svg",
        data: {
            name: "It's My Turn",
            type: "icon",
            trigger: { type: "event", event: "updateCombat" },
            conditionMode: "script",
            conditionScript: `// Check if it is currently my turn
// 检查当前是否轮到我行动
if (!game.combat || !game.combat.started) return false;
const combatant = game.combat.combatant;
return combatant && combatant.actorId === actor.id;`,
            display: { 
                icon: "icons/svg/combat.svg", 
                text: "YOUR TURN", 
                posX: "50%", 
                posY: "20%", 
                animation: "anim-pulse", 
                animationOptions: { pulseSpeed: 1 },
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#ffffff",
                opacity: 1,
                borderColor: "",
                borderSize: 0,
                backgroundColor: "",
                shadowColor: "",
                shadowSize: 0,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "invisible",
        name: "FOUNDRYAURAS.Preset.Invisible",
        description: "FOUNDRYAURAS.Preset.InvisibleDesc",
        icon: "icons/svg/eye.svg",
        data: {
            name: "Invisible Marker",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: `// Check for invisible status effect
// 检查是否有隐形状态
// Use recommended V11/V12+ statuses Set
// 使用推荐的 V11/V12+ statuses 集合
return actor.statuses?.has("invisible");`,
            display: { 
                icon: "icons/svg/eye.svg", 
                text: "Hidden", 
                posX: "50%", 
                posY: "80%", 
                animation: "none", 
                animationOptions: {},
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#ffffff",
                opacity: 1,
                borderColor: "",
                borderSize: 0,
                backgroundColor: "",
                shadowColor: "",
                shadowSize: 0,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "buff-watch",
        name: "FOUNDRYAURAS.Preset.Buff",
        description: "FOUNDRYAURAS.Preset.BuffDesc",
        icon: "icons/svg/aura.svg",
        data: {
            name: "Bless Watcher",
            type: "icon",
            trigger: { type: "event", event: "createActiveEffect" },
            conditionMode: "script",
            conditionScript: `// Check if token has Bless effect
// 检查己方token是否获得祝福术Bless效果
// Supports dnd5e system Bless spell
// 支持dnd5e系统的祝福术

// Check effects for Bless
// 检查效果中的Bless
const hasBlessEffect = actor.effects?.some(effect => {
    const label = effect.label?.toLowerCase() || '';
    const name = effect.name?.toLowerCase() || '';
    return label.includes('bless') || name.includes('bless') || 
           label.includes('祝福') || name.includes('祝福');
});

// Check status effects
// 检查状态效果
const hasBlessStatus = actor.statuses?.has('bless');

// Check for specific Bless spell effects (dnd5e)
// 检查特定的祝福术法术效果 (dnd5e)
const hasBlessSpell = actor.items?.some(item => 
    item.type === 'spell' && 
    item.name?.toLowerCase().includes('bless') && 
    item.system?.prepared === true
);

return hasBlessEffect || hasBlessStatus || hasBlessSpell;`,
            display: { 
                icon: "icons/svg/aura.svg", 
                text: "Blessed!", 
                posX: "50%", 
                posY: "50%", 
                animation: "anim-glow", 
                animationOptions: { glowSpeed: 1.5 },
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#ffffff",
                opacity: 1,
                borderColor: "#FFD700",
                borderSize: 2,
                backgroundColor: "",
                shadowColor: "#FFD700",
                shadowSize: 8,
                rotation: 0,
                scale: 1
            }
        }
    }
];
