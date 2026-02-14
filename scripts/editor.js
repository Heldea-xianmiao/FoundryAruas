// FoundryAuras - Single Aura Editor
// FoundryAuras - 单个光环编辑器

export class AuraEditor extends FormApplication {
    constructor(aura, submitCallback) {
        super(aura);
        this.aura = aura;
        this.submitCallback = submitCallback;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "foundry-auras-editor",
            title: game.i18n.localize("FOUNDRYAURAS.Editor.Title"),
            template: "modules/FoundryAuras/templates/editor.hbs",
            width: 500,
            height: 600,
            resizable: true,
            closeOnSubmit: true
        });
    }

    getData() {
        return {
            aura: this.aura,
            // Example trigger types
            triggerTypes: {
                "event": "Event Trigger",
                "combat": "Combat Trigger" // Planned
            },
            // Example events
            events: {
                "updateActor": "Actor Updated (HP, etc)",
                "controlToken": "Token Selected",
                "targetToken": "Token Targeted"
            }
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        // 将 jQuery-wrapped html 解包为原生 Element（Foundry 可能传入 jQuery 对象）
        const root = html instanceof HTMLElement ? html : html[0];

        // 处理动画选择变化（使用原生事件与选择器）
        const animSelect = root.querySelector('select[name="display.animation"]');
        const optionsContainer = root.querySelector('#animation-options');
        if (animSelect && optionsContainer) {
            animSelect.addEventListener('change', event => {
                const selectedAnimation = event.target.value;
                if (selectedAnimation === 'none') {
                    optionsContainer.style.display = 'none';
                } else {
                    optionsContainer.style.display = '';
                    // Hide all animation option groups first
                    optionsContainer.querySelectorAll('.form-group').forEach(g => g.style.display = 'none');
                    // Show only the relevant option group (避免使用 :has，改用查询子元素)
                    const key = selectedAnimation.replace('anim-', '');
                    for (const g of optionsContainer.querySelectorAll('.form-group')) {
                        if (g.querySelector(`input[name*="display.animationOptions.${key}Speed"]`)) {
                            g.style.display = '';
                            break;
                        }
                    }
                }
            });
        }

        // 处理条件模式变化
        const modeSelect = root.querySelector('select[name="conditionMode"]');
        if (modeSelect) {
            modeSelect.addEventListener('change', event => {
                const mode = event.target.value;
                const scriptGroup = Array.from(root.querySelectorAll('.form-group')).find(g => g.querySelector('textarea[name="conditionScript"]'));
                const simpleGroups = Array.from(root.querySelectorAll('.form-group')).filter(g => g.querySelector('select[name*="simpleCondition"]'));

                if (mode === 'script') {
                    if (scriptGroup) scriptGroup.style.display = '';
                    simpleGroups.forEach(g => g.style.display = 'none');
                } else {
                    if (scriptGroup) scriptGroup.style.display = 'none';
                    simpleGroups.forEach(g => g.style.display = '');
                }
            });
        }

        // 处理范围滑块值变化，并绘制填充条（解决“横条没有起到作用”的问题）
        const updateRangeFill = (slider) => {
            const min = parseFloat(slider.min) || 0;
            const max = parseFloat(slider.max) || 100;
            const val = parseFloat(slider.value) || 0;
            const percent = ((val - min) / (max - min)) * 100;
            // 使用 CSS 变量更新填充比例，避免直接覆盖样式带来的兼容问题
            slider.style.setProperty('--range-percent', `${percent}%`);
        };

        root.querySelectorAll('input[type="range"]').forEach(slider => {
            // 初始化填充与显示
            updateRangeFill(slider);
            const valueSpan = slider.parentElement.querySelector('.range-value');
                if (valueSpan) {
                    let unit = '';
                    // 对于动画速度选项，UI 表示为频率（Hz），数值越大表示越快
                    if (slider.name.includes('animationOptions') || slider.name.includes('Speed')) unit = 'Hz';
                    else if (slider.name.includes('rotation')) unit = '°';
                    else if (slider.name.includes('scale')) unit = 'x';
                    valueSpan.textContent = slider.value + unit;
                }

            slider.addEventListener('input', event => {
                const s = event.target;
                const valueSpan = s.parentElement.querySelector('.range-value');
                if (valueSpan) {
                    let unit = '';
                    if (s.name.includes('Speed')) unit = 's';
                    else if (s.name.includes('rotation')) unit = '°';
                    else if (s.name.includes('scale')) unit = 'x';
                    valueSpan.textContent = s.value + unit;
                }
                updateRangeFill(s);
            });
        });

        // 初始化动画选项可见性（加载时）
        const currentAnimation = animSelect ? animSelect.value : null;
        if (optionsContainer) {
            if (currentAnimation === 'none') {
                optionsContainer.style.display = 'none';
            } else if (currentAnimation) {
                optionsContainer.style.display = '';
                optionsContainer.querySelectorAll('.form-group').forEach(g => g.style.display = 'none');
                const key = currentAnimation.replace('anim-', '');
                for (const g of optionsContainer.querySelectorAll('.form-group')) {
                    if (g.querySelector(`input[name*="display.animationOptions.${key}Speed"]`)) {
                        g.style.display = '';
                        break;
                    }
                }
            }
        }

        // 初始化条件模式可见性（加载时）
        const currentMode = modeSelect ? (modeSelect.value || 'script') : 'script';
        const scriptGroupInit = Array.from(root.querySelectorAll('.form-group')).find(g => g.querySelector('textarea[name="conditionScript"]'));
        const simpleGroupsInit = Array.from(root.querySelectorAll('.form-group')).filter(g => g.querySelector('select[name*="simpleCondition"]'));
        if (currentMode === 'script') {
            if (scriptGroupInit) scriptGroupInit.style.display = '';
            simpleGroupsInit.forEach(g => g.style.display = 'none');
        } else {
            if (scriptGroupInit) scriptGroupInit.style.display = 'none';
            simpleGroupsInit.forEach(g => g.style.display = '');
        }

        // 初始化范围滑块显示（加载时）
        root.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueSpan = slider.parentElement.querySelector('.range-value');
            if (valueSpan) {
                let unit = '';
                if (slider.name.includes('Speed')) unit = 's';
                else if (slider.name.includes('rotation')) unit = '°';
                else if (slider.name.includes('scale')) unit = 'x';
                valueSpan.textContent = slider.value + unit;
            }
        });
    }
}