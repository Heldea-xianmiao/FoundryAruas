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
  'Fireball': 60,
  'Cure Wounds': 30,
  '火球术': 60,
  '治疗术': 30
};

function _resolveActorFromMessage(msg) {
  try {
    const speaker = msg.speaker || {};
    if (speaker.actor) return game.actors.get(speaker.actor) || null;
    if (speaker.token) {
      const t = canvas?.tokens?.placeables?.find(p => p.id === speaker.token || p.data?.tokenId === speaker.token);
      return t?.actor || null;
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
    if (f.dnd5e && f.dnd5e.context && f.dnd5e.context.item) return f.dnd5e.context.item.name;
    if (f['midi-qol'] && f['midi-qol'].itemName) return f['midi-qol'].itemName;
    if (msg?.content) {
      // 简单从 content 中提取第一个 <strong> 或 <h4> 标签内的文本
      // Naively extract the first <strong> or <h4> text from content
      const m = msg.content.match(/<strong[^>]*>([^<]+)<\/strong>/i) || msg.content.match(/<h4[^>]*>([^<]+)<\/h4>/i);
      if (m) return m[1].trim();
      // fallback: 尝试明文匹配首个中文或英文单词串
      // fallback: try a plain-text match for the first Chinese or English word sequence
      const m2 = msg.content.replace(/<[^>]+>/g,'').trim().match(/([\u4e00-\u9fff\w\- ]{2,50})/);
      if (m2) return m2[1].trim();
    }
  } catch (e) {}
  return null;
}

export function registerDnd5eIntegration(mapping) {
  if (_integrationHook) return console.warn('Dnd5e integration already registered');
  const map = Object.assign({}, DEFAULT_MAPPING, mapping || {});
  _integrationHook = Hooks.on('createChatMessage', async (msg) => {
    try {
      const itemName = _extractItemNameFromMessage(msg);
      if (!itemName) return;
      // 精确匹配 mapping 键
      const seconds = map[itemName];
      if (!seconds) return;
      const actor = _resolveActorFromMessage(msg) || (msg?.user ? game.users.get(msg.user)?.character : null);
      if (!actor) return;
      const key = `item:${itemName}`;
      // 设置冷却
      // Set the cooldown on the actor
      await window.FoundryAuras?.Cooldowns?.setCooldown(actor, key, seconds);
      console.log(`FoundryAuras: Set cooldown ${seconds}s for item ${itemName} on ${actor.name}`);
    } catch (e) {
      console.warn('FoundryAuras.dnd5eIntegration error', e);
    }
  });
  console.log('FoundryAuras: dnd5e integration registered');
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
        unregister: unregisterDnd5eIntegration
      };
      // Delay-register default mapping to ensure ChatMessage hooks are available
      registerDnd5eIntegration(DEFAULT_MAPPING);
      console.log('FoundryAuras: Auto-registered Cooldowns integration for dnd5e (default mapping)');
    }
  } catch (e) {
    console.warn('FoundryAuras: Auto-registration of Cooldowns integration failed', e);
  }
});
