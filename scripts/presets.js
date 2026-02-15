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
                borderColor: "#ff0000",
                borderSize: 2,
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                shadowColor: "#ff0000",
                shadowSize: 8,
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
                fontColor: "#ffff00",
                opacity: 1,
                borderColor: "#ffff00",
                borderSize: 2,
                backgroundColor: "rgba(255, 255, 0, 0.1)",
                shadowColor: "#ffff00",
                shadowSize: 6,
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
                animation: "anim-glow", 
                animationOptions: { glowSpeed: 2 },
                mode: "both",
                width: 64,
                height: 64,
                fontSize: 24,
                fontColor: "#8888ff",
                opacity: 0.8,
                borderColor: "#8888ff",
                borderSize: 1,
                backgroundColor: "rgba(136, 136, 255, 0.1)",
                shadowColor: "#8888ff",
                shadowSize: 4,
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
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                shadowColor: "#FFD700",
                shadowSize: 8,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "cooldown-active",
        name: "冷却时间警报",
        description: "当技能或法术处于冷却状态时显示警报",
        icon: "icons/svg/mystery-man.svg",
        data: {
            name: "冷却时间警报",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: `// Check if any cooldowns are active
// 检查是否有冷却时间处于激活状态
const cooldowns = actor.getFlag('FoundryAuras', 'cooldowns') || {};
const now = Date.now();

// Check if any cooldown is still active
// 检查是否有冷却时间仍然激活
for (const [key, value] of Object.entries(cooldowns)) {
    const expires = typeof value === 'number' ? value : (value?.expires || 0);
    if (expires > now) {
        return true;
    }
}

return false;`,
            display: { 
                icon: "icons/svg/mystery-man.svg", 
                text: "冷却中", 
                posX: "80%", 
                posY: "20%", 
                animation: "anim-pulse", 
                animationOptions: { pulseSpeed: 1 },
                mode: "both",
                width: 56,
                height: 56,
                fontSize: 18,
                fontColor: "#ff9900",
                opacity: 0.8,
                borderColor: "#ff9900",
                borderSize: 1,
                backgroundColor: "rgba(255, 153, 0, 0.2)",
                shadowColor: "#ff9900",
                shadowSize: 4,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "cooldown-ending",
        name: "冷却即将结束",
        description: "当冷却时间即将结束时显示提醒",
        icon: "icons/svg/blood.svg",
        data: {
            name: "冷却即将结束",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: `// Check if any cooldown is about to end (less than 3 seconds remaining)
// 检查是否有冷却时间即将结束（剩余时间少于3秒）
const cooldowns = actor.getFlag('FoundryAuras', 'cooldowns') || {};
const now = Date.now();
const threshold = 3000; // 3 seconds

// Check if any cooldown is ending soon
// 检查是否有冷却时间即将结束
for (const [key, value] of Object.entries(cooldowns)) {
    const expires = typeof value === 'number' ? value : (value?.expires || 0);
    if (expires > now && expires - now <= threshold) {
        return true;
    }
}

return false;`,
            display: { 
                icon: "icons/svg/blood.svg", 
                text: "冷却结束", 
                posX: "80%", 
                posY: "30%", 
                animation: "anim-bounce", 
                animationOptions: { bounceSpeed: 1 },
                mode: "both",
                width: 56,
                height: 56,
                fontSize: 18,
                fontColor: "#4CAF50",
                opacity: 0.9,
                borderColor: "#4CAF50",
                borderSize: 1,
                backgroundColor: "rgba(76, 175, 80, 0.2)",
                shadowColor: "#4CAF50",
                shadowSize: 6,
                rotation: 0,
                scale: 1
            }
        }
    },
    {
        id: "cooldown-special",
        name: "特殊技能冷却",
        description: "监控特定技能的冷却时间",
        icon: "icons/svg/combat.svg",
        data: {
            name: "特殊技能冷却",
            type: "icon",
            trigger: { type: "event", event: "updateActor" },
            conditionMode: "script",
            conditionScript: `// Check if specific important skills are on cooldown
// 检查特定重要技能是否处于冷却状态
const cooldowns = actor.getFlag('FoundryAuras', 'cooldowns') || {};
const now = Date.now();

// Define important skill keywords
// 定义重要技能关键词
const importantSkills = ['fireball', '火球', 'lightning', '闪电', 'teleport', '传送', 'wish', '愿望'];

// Check if any important skill is on cooldown
// 检查是否有重要技能处于冷却状态
for (const [key, value] of Object.entries(cooldowns)) {
    const keyLower = key.toLowerCase();
    const expires = typeof value === 'number' ? value : (value?.expires || 0);
    
    if (expires > now) {
        // Check if key contains any important skill keyword
        // 检查键是否包含任何重要技能关键词
        for (const skill of importantSkills) {
            if (keyLower.includes(skill)) {
                return true;
            }
        }
    }
}

return false;`,
            display: { 
                icon: "icons/svg/combat.svg", 
                text: "技能冷却", 
                posX: "80%", 
                posY: "40%", 
                animation: "anim-spin", 
                animationOptions: { spinSpeed: 2 },
                mode: "both",
                width: 56,
                height: 56,
                fontSize: 18,
                fontColor: "#ff6b6b",
                opacity: 0.8,
                borderColor: "#ff6b6b",
                borderSize: 1,
                backgroundColor: "rgba(255, 107, 107, 0.2)",
                shadowColor: "#ff6b6b",
                shadowSize: 5,
                rotation: 0,
                scale: 1
            }
        }
    }
];

