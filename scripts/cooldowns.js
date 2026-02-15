/*
  FoundryAuras - Cooldowns
  Minimal cooldown tracking API for FoundryAuras.
  - 存储位置：Actor flag `FoundryAuras.cooldowns` (键 -> 到期时间戳 ms)
  - 提供方法：setCooldown, getRemaining, isOnCooldown, consumeCooldown, purgeExpired
  - 导出到全局：`window.FoundryAuras.Cooldowns`
*/

Hooks.once('ready', async () => {
  window.FoundryAuras = window.FoundryAuras || {};
  window.FoundryAuras.Cooldowns = {
    setCooldown,
    getRemaining,
    isOnCooldown,
    consumeCooldown,
    purgeExpired
  };

  // 定期清理过期冷却（每分钟一次）
  // Periodically purge expired cooldowns (every minute)
  setInterval(() => {
    purgeExpired().catch(err => console.warn('Cooldown purge failed', err));
  }, 60_000);
});

// Helper: 是否启用全局持久化
// Helper: Whether to use global persistent storage
function _useGlobalStorage() {
  try {
    return !!game.settings.get('FoundryAuras', 'cooldowns.useGlobalStorage');
  } catch (e) {
    return false;
  }
}

// Helper: 获取模块全局映射对象
// Helper: Get the module-level global mapping object
function _getGlobalMapping() {
  try {
    return game.settings.get('FoundryAuras', 'cooldowns.globalStorage') || {};
  } catch (e) {
    return {};
  }
}

async function _setGlobalMapping(map) {
  try {
    await game.settings.set('FoundryAuras', 'cooldowns.globalStorage', map || {});
  } catch (e) {
    console.warn('FoundryAuras | Failed to write global cooldown storage', e);
  }
}

async function _updateGlobalForActor(actor, cur) {
  if (!_useGlobalStorage()) return;
  const map = _getGlobalMapping();
  if (!cur || Object.keys(cur).length === 0) {
    // remove
    delete map[actor.id];
  } else {
    map[actor.id] = cur;
  }
  await _setGlobalMapping(map);
}

// 在 actor 删除时清理全局存储
// Clean up global storage when an actor is deleted
Hooks.on('deleteActor', async (actor) => {
  if (!_useGlobalStorage()) return;
  const map = _getGlobalMapping();
  if (map && map[actor.id]) {
    delete map[actor.id];
    await _setGlobalMapping(map);
  }
});

async function _resolveActor(actor) {
  if (!actor) return null;
  if (typeof actor === 'string') return game.actors.get(actor) || game.actors.getName(actor) || null;
  if (actor instanceof Actor) return actor;
  if (actor?.actor) return actor.actor; // token or token document
  return null;
}

async function setCooldown(actorRef, key, seconds) {
  const actor = await _resolveActor(actorRef);
  if (!actor) throw new Error('Actor not found');
  const expires = Date.now() + Math.max(0, Math.floor(seconds)) * 1000;
  const cur = (actor.getFlag('FoundryAuras', 'cooldowns') || {});
  cur[key] = expires;
  await actor.setFlag('FoundryAuras', 'cooldowns', cur);
  // 可选：同步到模块全局存储，便于导出/诊断
  // Optional: sync to module-level global storage for export/diagnostics
  try { await _updateGlobalForActor(actor, cur); } catch (e) { /* ignore */ }
  return expires;
}

function getRemaining(actorRef, key) {
  const actor = (actorRef instanceof Actor) ? actorRef : (actorRef?.actor || null);
  if (!actor) return 0;
  // 优先从 actor flag 获取
  // Prefer reading from the actor flag first
  const cur = (actor.getFlag('FoundryAuras', 'cooldowns') || {});
  let expires = cur?.[key];
  // 回退到全局存储（如果启用并且 actor flag 中未找到）
  // Fallback to global storage if enabled and not found on actor flag
  if ((!expires || expires <= 0) && _useGlobalStorage()) {
    const map = _getGlobalMapping();
    const actorMap = map?.[actor.id] || {};
    expires = actorMap?.[key] || expires;
  }
  if (!expires) return 0;
  const rem = Math.ceil(Math.max(0, expires - Date.now()) / 1000);
  return rem;
}

function isOnCooldown(actorRef, key) {
  return getRemaining(actorRef, key) > 0;
}

async function consumeCooldown(actorRef, key, seconds) {
  // 直接设置冷却（占位实现）。可根据需要扩展为消耗/累计机制。
  return setCooldown(actorRef, key, seconds);
}

async function purgeExpired() {
  for (const a of game.actors.contents) {
    const cur = (a.getFlag('FoundryAuras', 'cooldowns') || {});
    let changed = false;
    for (const [k, ts] of Object.entries(cur)) {
      if (!ts || Date.now() >= ts) {
        delete cur[k];
        changed = true;
      }
    }
    if (changed) {
      try {
        await a.setFlag('FoundryAuras', 'cooldowns', cur);
        try { await _updateGlobalForActor(a, cur); } catch (e) { /* ignore */ }
      } catch (e) {
        console.warn('Failed to purge cooldowns for actor', a.id, e);
      }
    }
  }
}

// 导出模块（供打包或模块系统使用）
// Export module functions for bundling or module systems
export { setCooldown, getRemaining, isOnCooldown, consumeCooldown, purgeExpired };
