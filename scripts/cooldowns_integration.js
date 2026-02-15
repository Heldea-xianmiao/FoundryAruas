/*
  Optional dnd5e integration for Cooldowns
  - 提供 registerDnd5eIntegration(mapping) 和 unregisterDnd5eIntegration()
  - mapping: { "火球术": 60, "治疗术": 30 } （item name -> seconds）
  - 该集成为可选注册，不在模块初始化时自动绑定
*/

let _integrationHook = null;

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
  try {
    // dnd5e chat message may include flags.dnd5e.roll or flags.item
    const f = msg.flags || {};
    if (f.dnd5e && f.dnd5e.context && f.dnd5e.context.item) return f.dnd5e.context.item.name;
    if (f['midi-qol'] && f['midi-qol'].itemName) return f['midi-qol'].itemName;
    if (msg?.content) {
      // 简单从 content 中提取第一个 <strong> 或 <h4> 标签内的文本
      const m = msg.content.match(/<strong[^>]*>([^<]+)<\/strong>/i) || msg.content.match(/<h4[^>]*>([^<]+)<\/h4>/i);
      if (m) return m[1].trim();
      // fallback: 尝试明文匹配首个中文或英文单词串
      const m2 = msg.content.replace(/<[^>]+>/g,'').trim().match(/([\u4e00-\u9fff\w\- ]{2,50})/);
      if (m2) return m2[1].trim();
    }
  } catch (e) {}
  return null;
}

export function registerDnd5eIntegration(mapping) {
  if (_integrationHook) return console.warn('Dnd5e integration already registered');
  _integrationHook = Hooks.on('createChatMessage', async (msg) => {
    try {
      const itemName = _extractItemNameFromMessage(msg);
      if (!itemName) return;
      // 精确匹配 mapping 键
      const seconds = mapping[itemName];
      if (!seconds) return;
      const actor = _resolveActorFromMessage(msg) || (msg?.user ? game.users.get(msg.user)?.character : null);
      if (!actor) return;
      const key = `item:${itemName}`;
      // 设置冷却
      await window.FoundryAuras?.Cooldowns?.setCooldown(actor, key, seconds);
      console.log(`FoundryAuras: 为 ${actor.name} 的物品 ${itemName} 设置冷却 ${seconds}s`);
    } catch (e) {
      console.warn('FoundryAuras.dnd5eIntegration error', e);
    }
  });
  console.log('FoundryAuras: dnd5e 集成已注册');
}

export function unregisterDnd5eIntegration() {
  if (!_integrationHook) return;
  Hooks.off('createChatMessage', _integrationHook);
  _integrationHook = null;
  console.log('FoundryAuras: dnd5e 集成已注销');
}
