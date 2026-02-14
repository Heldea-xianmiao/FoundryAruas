/* 手动测试脚本：在 Foundry 控制台执行
   - 测试 setCooldown / getRemaining / isOnCooldown / purgeExpired 基本行为
*/

(async function(){
  if (!window.FoundryAuras?.Cooldowns) {
    console.warn('FoundryAuras.Cooldowns 未就绪，等候 1 秒后再试');
    await new Promise(r => setTimeout(r,1000));
  }
  const C = window.FoundryAuras?.Cooldowns;
  if (!C) return console.error('Cooldowns API 未找到');

  const token = canvas?.tokens?.controlled?.[0] || canvas?.tokens?.placeables?.[0];
  const actor = token?.actor || game.user.character || game.actors?.contents?.[0];
  if (!actor) return console.error('未找到 actor，请选中一个 token 或确保存在 actor');

  const key = 'test.manualKey';
  console.log('开始 Cooldowns 手动测试, actor=', actor.name);
  await C.setCooldown(actor, key, 3); // 3 秒
  console.log('设置 3s 冷却 -> 剩余:', C.getRemaining(actor, key));
  if (!C.isOnCooldown(actor, key)) console.error('错误: 应处于冷却中');

  // 等 4 秒后验证已过期
  await new Promise(r => setTimeout(r, 4000));
  console.log('4s 后剩余:', C.getRemaining(actor, key));
  if (C.isOnCooldown(actor, key)) console.error('错误: 冷却应已过期但仍标记为在冷却');

  // 强制 purge 并检查 flag
  await C.purgeExpired();
  const flags = actor.getFlag('FoundryAuras','cooldowns') || {};
  console.log('当前 actor cooldown flags:', flags);
  console.log('手动测试完成');
})();
