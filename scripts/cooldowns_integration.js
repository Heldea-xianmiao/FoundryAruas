/*
  Optional dnd5e integration for Cooldowns
  - 提供 registerDnd5eIntegration(mapping) 和 unregisterDnd5eIntegration()
  - mapping: { "火球术": 60, "治疗术": 30 } （item name -> seconds）
  - 该集成为可选注册，不在模块初始化时自动绑定
  - Provides registerDnd5eIntegration(mapping) and unregisterDnd5eIntegration()
  - mapping: { "Fireball": 60, "Cure Wounds": 30 } (item name -> seconds)
  - This integration is opt-in and is not automatically bound at module init
*/

let _integrationHook = null;

// 默认映射（示例）。可根据需要扩展或覆盖。
// Default mapping (example). Extend or override as needed.
const DEFAULT_MAPPING = {
  // 英文名 / 中文名 对应冷却秒数
  // Mapping of English/Chinese item names to cooldown seconds
  // 核心法术
  'Fireball': 60,
  '火球术': 60,
  'Cure Wounds': 30,
  '治疗术': 30,
  'Magic Missile': 15,
  '魔法飞弹': 15,
  'Lightning Bolt': 45,
  '闪电箭': 45,
  'Healing Word': 20,
  '治疗真言': 20,
  'Counterspell': 30,
  '反制法术': 30,
  'Teleport': 120,
  '传送术': 120,
  'Wish': 300,
  '愿望术': 300,
  // 常用技能
  'Sneak Attack': 10,
  '偷袭': 10,
  'Rage': 60,
  '狂怒': 60,
  'Divine Smite': 15,
  '神圣斩击': 15,
  'Wild Shape': 180,
  '野性变形': 180
};

function _resolveActorFromMessage(msg) {
  try {
    const speaker = msg.speaker || {};
    if (speaker.actor) return game.actors.get(speaker.actor) || null;
    if (speaker.token) {
      const t = canvas?.tokens?.placeables?.find(p => p.id === speaker.token || p.data?.tokenId === speaker.token);
      return t?.actor || null;
    }
    // 尝试从消息的 user 中获取角色
    if (msg.user) {
      const user = game.users.get(msg.user);
      if (user && user.character) return user.character;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function _extractItemNameFromMessage(msg) {
  // 尝试从 flags 或 content 中抽取物品/技能名称
  // Try to extract item/skill name from message flags or content
  try {
    // dnd5e chat message may include flags.dnd5e.roll or flags.item
    const f = msg.flags || {};
    
    // 优先从 dnd5e 标志中提取
    if (f.dnd5e && f.dnd5e.context && f.dnd5e.context.item) {
      return f.dnd5e.context.item.name;
    }
    
    // 从 midi-qol 标志中提取
    if (f['midi-qol'] && f['midi-qol'].itemName) {
      return f['midi-qol'].itemName;
    }
    
    // 从 item 标志中提取
    if (f.item && f.item.name) {
      return f.item.name;
    }
    
    // 从 content 中提取
    if (msg?.content) {
      // 尝试从 <strong> 或 <h4> 标签中提取
      const m = msg.content.match(/<strong[^>]*>([^<]+)<\/strong>/i) || msg.content.match(/<h4[^>]*>([^<]+)<\/h4>/i);
      if (m) return m[1].trim();
      
      // 尝试从 <div class="item-name"> 中提取
      const itemNameMatch = msg.content.match(/<div[^>]*class="[^>]*item-name[^>]*>([^<]+)<\/div>/i);
      if (itemNameMatch) return itemNameMatch[1].trim();
      
      // 回退：尝试明文匹配首个中文或英文单词串
      const m2 = msg.content.replace(/<[^>]+>/g,'').trim().match(/([\u4e00-\u9fff\w\- ]{2,50})/);
      if (m2) return m2[1].trim();
    }
  } catch (e) {
    console.warn('FoundryAuras: Error extracting item name from message', e);
  }
  return null;
}

function _getCooldownDuration(itemName, mapping) {
  // 精确匹配
  if (mapping[itemName]) {
    return mapping[itemName];
  }
  
  // 不区分大小写匹配
  const lowerItemName = itemName.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerItemName) {
      return value;
    }
  }
  
  // 部分匹配（仅作为最后的回退）
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase().includes(lowerItemName) || lowerItemName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

export function registerDnd5eIntegration(mapping) {
  if (_integrationHook) return console.warn('Dnd5e integration already registered');
  const map = Object.assign({}, DEFAULT_MAPPING, mapping || {});
  
  _integrationHook = Hooks.on('createChatMessage', async (msg) => {
    try {
      // 跳过非 dnd5e 系统的消息
      if (game?.system?.id !== 'dnd5e') return;
      
      const itemName = _extractItemNameFromMessage(msg);
      if (!itemName) return;
      
      // 获取冷却时间
      const seconds = _getCooldownDuration(itemName, map);
      if (!seconds) return;
      
      // 解析 actor
      const actor = _resolveActorFromMessage(msg) || (msg?.user ? game.users.get(msg.user)?.character : null);
      if (!actor) return;
      
      const key = `item:${itemName}`;
      // 设置冷却
      await window.FoundryAuras?.Cooldowns?.setCooldown(actor, key, seconds);
      console.log(`FoundryAuras: Set cooldown ${seconds}s for item ${itemName} on ${actor.name}`);
      
      // 触发冷却时间更新钩子，以便 UI 立即更新
      try {
        Hooks.call('FoundryAuras.cooldownsUpdated', actor.id, actor.getFlag('FoundryAuras', 'cooldowns') || {});
      } catch (e) { /* ignore */ }
      
    } catch (e) {
      console.warn('FoundryAuras.dnd5eIntegration error', e);
    }
  });
  
  console.log('FoundryAuras: dnd5e integration registered with', Object.keys(map).length, 'mappings');
}

export function unregisterDnd5eIntegration() {
  if (!_integrationHook) return;
  Hooks.off('createChatMessage', _integrationHook);
  _integrationHook = null;
  console.log('FoundryAuras: dnd5e integration unregistered');
}

  // 自动注册：如果系统为 dnd5e，则在 ready 时自动注册默认映射，方便即刻使用。
  // Auto-register: if the system is dnd5e, register the default mapping on ready for convenience.
Hooks.once('ready', () => {
  try {
    if (game?.system?.id === 'dnd5e') {
      // 如果已存在 FoundryAuras.CooldownsIntegration 注册接口，避免重复
      if (!window.FoundryAuras) window.FoundryAuras = {};
      window.FoundryAuras.CooldownsIntegration = {
        register: registerDnd5eIntegration,
        unregister: unregisterDnd5eIntegration,
        DEFAULT_MAPPING: DEFAULT_MAPPING
      };
      // Delay-register default mapping to ensure ChatMessage hooks are available
      setTimeout(() => {
        registerDnd5eIntegration(DEFAULT_MAPPING);
        console.log('FoundryAuras: Auto-registered Cooldowns integration for dnd5e (default mapping)');
      }, 1000);
    }
  } catch (e) {
    console.warn('FoundryAuras: Auto-registration of Cooldowns integration failed', e);
  }
});
