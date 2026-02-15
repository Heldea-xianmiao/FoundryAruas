export class CooldownsSettings extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
    return {
      enabled,
      mapping: JSON.stringify(mapping, null, 2)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('button[data-action="test"]').on('click', async (ev) => {
      ev.preventDefault();
      const data = this._getSubmitData();
      let map;
      try { map = JSON.parse(data.mapping); } catch (e) { return ui.notifications.error('映射 JSON 解析失败: ' + e.message); }
      ui.notifications.info('当前映射已加载 (' + Object.keys(map).length + ' 条)');
    });
  }

  async _updateObject(event, formData) {
    // formData.mapping is string
    try {
      const mapping = JSON.parse(formData.mapping || '{}');
      await game.settings.set('FoundryAuras', 'cooldowns.mapping', mapping);
    } catch (e) {
      return ui.notifications.error('保存失败：映射 JSON 无效：' + e.message);
    }
    await game.settings.set('FoundryAuras', 'cooldowns.enableIntegration', !!formData.enabled);
    ui.notifications.info('FoundryAuras: Cooldowns 设置已保存');
  }
}

// Register settings and menu on init
Hooks.once('init', () => {
  game.settings.register('FoundryAuras', 'cooldowns.enableIntegration', {
    name: 'FOUNDRYAURAS.Settings.Cooldowns.Enable.Name',
    hint: 'FOUNDRYAURAS.Settings.Cooldowns.Enable.Hint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true
  });

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

  game.settings.registerMenu('FoundryAuras', 'cooldownsSettings', {
    name: game.i18n.localize('FOUNDRYAURAS.Settings.Cooldowns.MenuName') || 'Cooldowns 设置',
    label: game.i18n.localize('FOUNDRYAURAS.Settings.Cooldowns.MenuLabel') || 'Cooldowns',
    icon: 'fas fa-stopwatch',
    type: CooldownsSettings,
    restricted: true
  });
});
