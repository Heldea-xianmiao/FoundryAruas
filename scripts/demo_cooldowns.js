// Demo script: 为当前选中 token 的 actor 设置 30 秒冷却，并打印结果
(async () => {
  if (!window.FoundryAuras?.Cooldowns) {
    console.warn('FoundryAuras.Cooldowns 未就绪，等候 1 秒后再试');
    console.warn('FoundryAuras.Cooldowns not ready, retrying in 1s');
    await new Promise(r => setTimeout(r, 1000));
  }
  const C = window.FoundryAuras?.Cooldowns;
  if (!C) return console.error('Cooldowns API 未找到');

  let actor = null;
  if (typeof canvas !== 'undefined' && canvas.tokens?.controlled?.length) {
    actor = canvas.tokens.controlled[0].actor;
  }
  if (!actor && game.user.character) actor = game.user.character;
  if (!actor) actor = game.actors.contents[0];
    if (!actor) return console.error('未找到 actor，请选中一个 token 或确保存在 actor');
    // No actor found
    // No actor found: please select a token or ensure an actor exists

  console.log('FoundryAuras Demo: actor =', actor.name);
  await C.setCooldown(actor, 'demo.spellX', 30);
  console.log('已设置 demo.spellX 为 30s 冷却');
  console.log('剩余秒数:', C.getRemaining(actor, 'demo.spellX'));
})();
