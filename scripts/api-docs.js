// FoundryAuras - API Documentation Snippets
// 用于在编辑器中提供自动补全参考列表

export const API_DOCS = [
    // --- VARIABLES ---
    // --- 变量 ---
    { name: "Actor (Entity)", code: "actor", type: "variable", group: "Globals" },
    { name: "Token (Placeable)", code: "token", type: "variable", group: "Globals" },
    { name: "Game (Global)", code: "game", type: "variable", group: "Globals" },
    { name: "Canvas (Global)", code: "canvas", type: "variable", group: "Globals" },
    
    // --- ACTOR PROPERTIES (Generic) ---
    // --- 角色属性 (通用) ---
    { name: "Actor Name", code: "actor.name", type: "prop", group: "Actor" },
    { name: "HP Value", code: "actor.system.attributes.hp.value", type: "prop", group: "Actor" },
    { name: "HP Max", code: "actor.system.attributes.hp.max", type: "prop", group: "Actor" },
    { name: "HP Temp", code: "actor.system.attributes.hp.temp", type: "prop", group: "Actor" },
    { name: "Armor Class", code: "actor.system.attributes.ac.value", type: "prop", group: "Actor" },
    { name: "Movement Speed", code: "actor.system.attributes.movement.walk", type: "prop", group: "Actor" },
    { name: "Level (Character)", code: "actor.system.details.level", type: "prop", group: "Actor" },
    { name: "CR (NPC)", code: "actor.system.details.cr", type: "prop", group: "Actor" },
    
    // --- EFFECTS ---
    // --- 效果 ---
    { name: "Effects (Array)", code: "actor.effects", type: "prop", group: "Effect" },
    { name: "Has Effect?", code: "actor.effects.some(e => e.label === 'Name')", type: "snippet", group: "Effect" },
    { name: "Status Effects (Token)", code: "token.document.hasStatusEffect('invisible')", type: "snippet", group: "Effect" },
    
    // --- COMBAT ---
    // --- 战斗 ---
    { name: "In Combat?", code: "game.combat && game.combat.started", type: "snippet", group: "Combat" },
    { name: "Is My Turn?", code: "game.combat?.combatant?.actorId === actor.id", type: "snippet", group: "Combat" },
    { name: "Round Number", code: "game.combat.round", type: "prop", group: "Combat" },
    { name: "Turn Number", code: "game.combat.turn", type: "prop", group: "Combat" },
    
    // --- ITEMS ---
    // --- 物品 ---
    { name: "Items (Collection)", code: "actor.items", type: "prop", group: "Item" },
    { name: "Find Item", code: "actor.items.find(i => i.name === 'Sword')", type: "snippet", group: "Item" },
    { name: "Has Item?", code: "actor.items.some(i => i.name === 'Potion')", type: "snippet", group: "Item" },
    
    // --- DND5E SPECIFIC ---
    // --- DND5E 特有 ---
    { name: "Spell Slots (Lvl 1)", code: "actor.system.spells.spell1.value", type: "prop", group: "DND5E" },
    { name: "Skill (Acrobatics)", code: "actor.system.skills.acr.total", type: "prop", group: "DND5E" },
    { name: "Ability (Str)", code: "actor.system.abilities.str.value", type: "prop", group: "DND5E" },
    { name: "Ability Mod (Str)", code: "actor.system.abilities.str.mod", type: "prop", group: "DND5E" },
    { name: "Classes", code: "actor.system.classes", type: "prop", group: "DND5E" },
    { name: "Resources (Primary)", code: "actor.system.resources.primary.value", type: "prop", group: "DND5E" },
    
    // --- DND5E EXTENDED ---
    // --- DND5E 扩展 ---
    { name: "Initiative", code: "actor.system.attributes.init.total", type: "prop", group: "DND5E" },
    { name: "Proficiency Bonus", code: "actor.system.attributes.prof", type: "prop", group: "DND5E" },
    { name: "Short Rest Hit Dice", code: "actor.system.attributes.hd", type: "prop", group: "DND5E" },
    { name: "Exhaustion", code: "actor.system.attributes.exhaustion", type: "prop", group: "DND5E" },
    { name: "Spell Save DC", code: "actor.system.attributes.spelldc", type: "prop", group: "DND5E" },
    
    // Currency
    // 货币
    { name: "Currency (Gold)", code: "actor.system.currency.gp", type: "prop", group: "DND5E" },
    { name: "Currency (Silver)", code: "actor.system.currency.sp", type: "prop", group: "DND5E" },
    
    // Roll Data context
    // 判定数据上下文
    { name: "Get Roll Data", code: "actor.getRollData()", type: "snippet", group: "DND5E" },
    
    // Temporary HP
    // 临时生命值
    { name: "Temp HP", code: "actor.system.attributes.hp.temp", type: "prop", group: "DND5E" },
    { name: "Temp HP Max", code: "actor.system.attributes.hp.tempmax", type: "prop", group: "DND5E" }
];