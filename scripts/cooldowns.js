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
  setInterval(() => {
    purgeExpired().catch(err => console.warn('Cooldown purge failed', err));
  }, 60_000);
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
  return expires;
}

function getRemaining(actorRef, key) {
  const actor = (actorRef instanceof Actor) ? actorRef : (actorRef?.actor || null);
  if (!actor) return 0;
  const cur = (actor.getFlag('FoundryAuras', 'cooldowns') || {});
  const expires = cur?.[key];
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
      } catch (e) {
        console.warn('Failed to purge cooldowns for actor', a.id, e);
      }
    }
  }
}

// 导出模块（供打包或模块系统使用）
export { setCooldown, getRemaining, isOnCooldown, consumeCooldown, purgeExpired };
