export class CooldownsSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'foundry-auras-cooldowns-settings',
      title: game.i18n.localize('FOUNDRYAURAS.Settings.Cooldowns.Title') || 'FoundryAuras - Cooldowns 设置',
      template: 'modules/FoundryAuras/templates/cooldowns-settings.hbs',
      width: 600,
      submitOnChange: false,
      closeOnSubmit: true
    });
  }

  constructor(...args) {
    super(...args);
  }

  async getData() {
    const enabled = game.settings.get('FoundryAuras', 'cooldowns.enableIntegration');
    const mapping = game.settings.get('FoundryAuras', 'cooldowns.mapping');
    const useGlobal = game.settings.get('FoundryAuras', 'cooldowns.useGlobalStorage');
    return {
      enabled,
      useGlobalStorage: !!useGlobal,
      mapping: JSON.stringify(mapping, null, 2)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const btn = html[0]?.querySelector('button[data-action="test"]');
    if (btn) btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const data = this._getSubmitData();
      let map;
      try { map = JSON.parse(data.mapping); } catch (e) { 
        // 映射 JSON 解析失败
        // Mapping JSON parse failed
        return ui.notifications.error('映射 JSON 解析失败: ' + e.message);
      }
      // 显示已加载条数
      // Show loaded mapping count
      ui.notifications.info('当前映射已加载 (' + Object.keys(map).length + ' 条)');
    });
  }

  async _updateObject(event, formData) {
    // formData.mapping is string
    try {
      const mapping = JSON.parse(formData.mapping || '{}');
      await game.settings.set('FoundryAuras', 'cooldowns.mapping', mapping);
    } catch (e) {
      // 保存失败：映射 JSON 无效
      // Save failed: mapping JSON invalid
      return ui.notifications.error('保存失败：映射 JSON 无效：' + e.message);
    }
    await game.settings.set('FoundryAuras', 'cooldowns.enableIntegration', !!formData.enabled);
    await game.settings.set('FoundryAuras', 'cooldowns.useGlobalStorage', !!formData.useGlobalStorage);
    ui.notifications.info('FoundryAuras: Cooldowns 设置已保存');
  }
}

// Register settings and menu on init
Hooks.once('init', () => {
  // Register setting: enable integration
  // Register setting: enable dnd5e integration
  game.settings.register('FoundryAuras', 'cooldowns.enableIntegration', {
    name: 'FOUNDRYAURAS.Settings.Cooldowns.Enable.Name',
    hint: 'FOUNDRYAURAS.Settings.Cooldowns.Enable.Hint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true
  });

  // Register setting: use global storage
  game.settings.register('FoundryAuras', 'cooldowns.useGlobalStorage', {
    name: 'FOUNDRYAURAS.Settings.Cooldowns.UseGlobalStorage.Name',
    hint: 'FOUNDRYAURAS.Settings.Cooldowns.UseGlobalStorage.Hint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  });

  // Register setting: global storage object
  game.settings.register('FoundryAuras', 'cooldowns.globalStorage', {
    name: 'FOUNDRYAURAS.Settings.Cooldowns.GlobalStorage.Name',
    hint: 'FOUNDRYAURAS.Settings.Cooldowns.GlobalStorage.Hint',
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });

  // Register setting: default mapping
  game.settings.register('FoundryAuras', 'cooldowns.mapping', {
    name: 'FOUNDRYAURAS.Settings.Cooldowns.Mapping.Name',
    hint: 'FOUNDRYAURAS.Settings.Cooldowns.Mapping.Hint',
    scope: 'world',
    config: false,
    type: Object,
    default: {
      'Fireball': 60,
      'Cure Wounds': 30
    }
  });

  // Register menu: Cooldowns settings UI
  game.settings.registerMenu('FoundryAuras', 'cooldownsSettings', {
    name: game.i18n.localize('FOUNDRYAURAS.Settings.Cooldowns.MenuName') || 'Cooldowns 设置',
    label: game.i18n.localize('FOUNDRYAURAS.Settings.Cooldowns.MenuLabel') || 'Cooldowns',
    icon: 'fas fa-stopwatch',
    type: CooldownsSettings,
    restricted: true
  });
});
