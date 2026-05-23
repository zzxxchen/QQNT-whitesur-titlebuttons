(() => {
    const svgVariables = {
        close: {
            normal: '--svg-close',
            hover: '--svg-close-hover',
            active: '--svg-close-active'
        },
        max: {
            normal: '--svg-max',
            hover: '--svg-max-hover',
            active: '--svg-max-active'
        },
        unmax: {
            normal: '--svg-unmax',
            hover: '--svg-unmax-hover',
            active: '--svg-unmax-active'
        },
        min: {
            normal: '--svg-min',
            hover: '--svg-min-hover',
            active: '--svg-min-active'
        }
    };

    function getCssVariable(varName) {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue(varName).trim();
    }

    function findWindowControlArea() {
        const selectors = [
            '.window-control-area',
            '.titlebar-control-area',
            '.window-controls',
            '.titlebar-buttons',
            '.titlebar-button-group',
            'div[class*="window-control"]',
            'div[class*="titlebar-button"]',
            'div[class*="title-bar"]',
            '.titker-titlebar-button',
            '.linux-titlebar-button',
            '.titlebar'
        ];
        
        for (const sel of selectors) {
            const area = document.querySelector(sel);
            if (area) {
                return area;
            }
        }
        
        return document.body;
    }

    function findWindowButtons() {
        const controlArea = findWindowControlArea();
        
        const allPossibleSelectors = [
            '.window-control-area_btn',
            '.window-control-area__btn',
            '.window-control-area button',
            '.titlebar-button'
        ];
        
        let buttons = [];
        
        allPossibleSelectors.forEach(sel => {
            const found = controlArea.querySelectorAll(sel);
            if (found.length > 0) {
                found.forEach(btn => {
                    if (!buttons.includes(btn)) {
                        const rect = btn.getBoundingClientRect();
                        const className = btn.className?.toString().toLowerCase() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        const textContent = btn.textContent || '';
                        
                        if (rect.width > 0 && rect.height > 0 && 
                            !className.includes('narrow-toggler') && 
                            !ariaLabel.includes('经典模式') &&
                            !ariaLabel.includes('设置') &&
                            !ariaLabel.includes('菜单') &&
                            !ariaLabel.includes('天气') &&
                            !ariaLabel.includes('小程序') &&
                            !textContent.includes('天气') &&
                            !textContent.includes('小程序')) {
                            buttons.push(btn);
                        }
                    }
                });
            }
        });
        
        if (buttons.length >= 3) {
            buttons.sort((a, b) => {
                return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
            });
        }
        
        return buttons;
    }

    function getButtonType(btn) {
        const text = (btn.textContent || '').toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const className = btn.className?.toString().toLowerCase() || '';
        const dataAttr = (btn.getAttribute('data-title') || '').toLowerCase();
        const dataKey = (btn.getAttribute('data-key') || '').toLowerCase();
        const id = (btn.id || '').toLowerCase();
        
        if (text.includes('close') || title.includes('close') || ariaLabel.includes('close') || 
            className.includes('close') || dataAttr.includes('close') || id.includes('close') ||
            ariaLabel.includes('关闭')) {
            return 'close';
        }
        
        if (text.includes('min') || title.includes('min') || ariaLabel.includes('min') || 
            className.includes('min') || className.includes('minim') || dataAttr.includes('min') || id.includes('min') ||
            ariaLabel.includes('最小化') || text.includes('最小化') || ariaLabel.includes('最化')) {
            return 'min';
        }
        
        if (text.includes('restore') || title.includes('restore') || ariaLabel.includes('restore') || 
            className.includes('restore') || className.includes('unmax') || dataAttr.includes('restore') || 
            id.includes('restore') || id.includes('unmax') || dataKey.includes('restore') ||
            ariaLabel.includes('还原') || text.includes('还原')) {
            return 'unmax';
        }
        
        if (text.includes('max') || title.includes('max') || ariaLabel.includes('max') || 
            className.includes('max') || dataAttr.includes('max') || id.includes('max') ||
            ariaLabel.includes('最大化') || text.includes('最大化')) {
            return 'max';
        }
        
        return null;
    }

    function getButtonTypeByPosition(buttons, btn) {
        const index = Array.from(buttons).indexOf(btn);
        const len = buttons.length;
        
        if (len >= 3) {
            const firstBtn = buttons[0];
            const lastBtn = buttons[len - 1];
            const firstType = getButtonType(firstBtn);
            const lastType = getButtonType(lastBtn);
            
            if (firstType === 'close') {
                if (index === 0) return 'close';
                if (index === len - 1) return 'min';
                if (index === len - 2) return 'max';
                return 'max';
            }
            
            if (lastType === 'close') {
                if (index === len - 1) return 'close';
                if (index === 0) return 'min';
                if (index === 1) return 'max';
                return 'max';
            }
            
            if (index === 0) return 'min';
            if (index === len - 1) return 'close';
            if (index === len - 2) return 'max';
            return 'max';
        }
        
        return null;
    }

    function isDarkMode() {
        const html = document.documentElement;
        const theme = html.getAttribute('theme') || html.getAttribute('data-theme') || '';
        if (theme.includes('dark')) return true;
        
        const bgColor = getComputedStyle(document.body).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            const rgb = bgColor.match(/\d+/g);
            if (rgb) {
                const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
                return brightness < 128;
            }
        }
        
        return false;
    }

    function getSvgForType(type, state, isDark) {
        const varName = svgVariables[type]?.[state];
        if (!varName) {
            if (type === 'unmax' && state === 'normal') {
                return getSvgForType('max', 'normal', isDark);
            }
            return '';
        }
        
        const svgUrl = getCssVariable(varName);
        
        if (svgUrl && svgUrl.startsWith('url("data:image/svg+xml;base64,')) {
            const base64 = svgUrl.match(/base64,([^"]+)/)?.[1];
            if (base64) {
                try {
                    const decoded = atob(base64);
                    return decoded;
                } catch (e) {
                }
            }
        }
        
        if (type === 'unmax' && state === 'normal') {
            return getSvgForType('max', 'normal', isDark);
        }
        
        return '';
    }

    function replaceButton(btn, type) {
        if (btn.querySelector('.whitesur-btn')) return;
        
        const isDark = isDarkMode();
        
        btn.innerHTML = '';
        if (type === 'close') {
             btn.style.cssText = 'background: transparent !important; border: none !important; padding: 0 !important; width: 20px !important; height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; outline: none !important; box-shadow: none !important; margin-right: 8px !important;';
         } else {
             btn.style.cssText = 'background: transparent !important; border: none !important; padding: 0 !important; width: 20px !important; height: 28px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; outline: none !important; box-shadow: none !important;';
         }
        btn.setAttribute('data-whitesur-processed', 'true');
        
        const normalSvg = getSvgForType(type, 'normal', isDark);
        const hoverSvg = getSvgForType(type, 'hover', isDark);
        const activeSvg = getSvgForType(type, 'active', isDark);
        
        const normalSpan = document.createElement('span');
        normalSpan.className = 'btn-normal whitesur-btn';
        normalSpan.innerHTML = normalSvg;
        normalSpan.style.cssText = 'display: inline-flex !important; width: 16px !important; height: 16px !important;';
        
        const hoverSpan = document.createElement('span');
        hoverSpan.className = 'btn-hover whitesur-btn';
        hoverSpan.innerHTML = hoverSvg;
        hoverSpan.style.cssText = 'display: none !important; width: 16px !important; height: 16px !important;';
        
        const activeSpan = document.createElement('span');
        activeSpan.className = 'btn-active whitesur-btn';
        activeSpan.innerHTML = activeSvg;
        activeSpan.style.cssText = 'display: none !important; width: 16px !important; height: 16px !important;';
        
        btn.appendChild(normalSpan);
        btn.appendChild(hoverSpan);
        btn.appendChild(activeSpan);

        const normal = btn.querySelector('.btn-normal');
        const hover = btn.querySelector('.btn-hover');
        const active = btn.querySelector('.btn-active');
        
        const updateIcon = () => {
            const currentType = getButtonType(btn);
            if (currentType && currentType !== type) {
                btn.innerHTML = '';
                const isDark = isDarkMode();
                type = currentType;
                
                const normalSvg = getSvgForType(type, 'normal', isDark);
                const hoverSvg = getSvgForType(type, 'hover', isDark);
                const activeSvg = getSvgForType(type, 'active', isDark);
                
                normal.innerHTML = normalSvg;
                hover.innerHTML = hoverSvg;
                active.innerHTML = activeSvg;
            }
        };

        btn.addEventListener('mouseenter', () => {
            normal.style.display = 'none';
            hover.style.display = 'inline-flex';
            active.style.display = 'none';
            btn.style.background = 'transparent';
        });

        btn.addEventListener('mouseleave', () => {
            normal.style.display = 'inline-flex';
            hover.style.display = 'none';
            active.style.display = 'none';
            btn.style.background = 'transparent';
        });

        btn.addEventListener('mousedown', () => {
            normal.style.display = 'none';
            hover.style.display = 'none';
            active.style.display = 'inline-flex';
        });

        btn.addEventListener('mouseup', () => {
            setTimeout(updateIcon, 50);
            normal.style.display = 'none';
            hover.style.display = 'inline-flex';
            active.style.display = 'none';
        });
    }

    function injectCssVariables() {
        if (document.getElementById('whitesur-css-vars')) return;
        
        const style = document.createElement('style');
        style.id = 'whitesur-css-vars';
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', './titlebutton.txt', false);
        try {
            xhr.send();
            if (xhr.status === 200) {
                const cssContent = xhr.responseText;
                style.textContent = cssContent + `
                    .global-container .topbar .user-profile-card__widgets,
                    .window-control-area_btn[aria-label*="天气"],
                    .window-control-area_btn[aria-label*="小程序"],
                    .window-control-area__btn[aria-label*="天气"],
                    .window-control-area__btn[aria-label*="小程序"] {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (e) {
            style.textContent = `
                :root {
                    --svg-close: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIGlkPSJ0aXRsZWJ1dHRvbi1jbG9zZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI5MywyNDIuNjQpIj4KICA8cmVjdCB4PSIyOTMiIHk9Ii0yNDIuNjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgcnk9IjEuNjkzMWUtNSIgb3BhY2l0eT0iMCIgc3Ryb2tlLXdpZHRoPSIuNDc0MzIiIHN0eWxlPSJwYWludC1vcmRlcjptYXJrZXJzIHN0cm9rZSBmaWxsIi8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjk0LC0yNDEuNjQpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICA8cGF0aCBkPSJtMTIgMTA0Ny40YzMuODY1OSAwIDYuOTk5OS0zLjEzNCA2Ljk5OTktN3MtMy4xMzQtNy02Ljk5OTktN2MtMy44NjYgMC03LjAwMDEgMy4xMzQtNy4wMDAxIDdzMy4xMzQgNyA3LjAwMDEgNyIgZmlsbD0iI2NiNGU0MyIvPgogICAgPHBhdGggZD0ibTEyIDEwNDYuOWMzLjU4OTggMCA2LjQ5OTktMi45MTAzIDYuNDk5OS02LjUwMDEgMC0zLjU4OTktMi45MTAyLTYuNS02LjQ5OTktNi41LTMuNTg5OSAwLTYuNTAwMSAyLjkxMDEtNi41MDAxIDYuNSAwIDMuNTg5OCAyLjkxMDIgNi41MDAxIDYuNTAwMSA2LjUwMDEiIGZpbGw9IiNmZTYyNTQiLz4KICAgPC9nPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==");
                    --svg-close-hover: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0zMjIgLTU4MC41OCkiPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4zNDAxOCAwIDAgLjM0MDE4IDg0LjkzMSAxNTMuMzMpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiPgogICAgPGcgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICA8cGF0aCBkPSJtMTIuMDAzIDEwNDUuOWMzLjAwNjggMCA1LjQ0NDQtMi40Mzc2IDUuNDQ0NC01LjQ0NDVzLTIuNDM3Ni01LjQ0NDQtNS40NDQ0LTUuNDQ0NGMtMy4wMDY5IDAtNS40NDQ1IDIuNDM3NS01LjQ0NDUgNS40NDQ0czIuNDM3NiA1LjQ0NDUgNS40NDQ1IDUuNDQ0NSIgZmlsbD0iI2NiNGU0MyIgc3Ryb2tlLXdpZHRoPSIuNzc3NzgiLz4KICAgICA8cGF0aCBkPSJtMTIuMDAzIDEwNDUuNWMyLjc5MiAwIDUuMDU1NS0yLjI2MzUgNS4wNTU1LTUuMDU1NiAwLTIuNzkyMi0yLjI2MzUtNS4wNTU3LTUuMDU1NS01LjA1NTctMi43OTIyIDAtNS4wNTU2IDIuMjYzNS01LjA1NTYgNS4wNTU3IDAgMi43OTIxIDIuMjYzNSA1LjA1NTYgNS4wNTU2IDUuMDU1NiIgZmlsbD0iI2ZlNjI1NCIgc3Ryb2tlLXdpZHRoPSIuNzY0NzEiLz4KICAgIDwvZz4KICAgPC9nPgogIDwvZz4KICA8cGF0aCBkPSJtODYuNTY0IDE1NC45NmMtMC4xMDM2NSAwLjEwMzY0LTAuMTAzNjUgMC4yNzA1MSAwIDAuMzc0MTdsMC4zNzQxNyAwLjM3NDE4LTAuMzc0MTcgMC4zNzQxN2MtMC4xMDM2NSAwLjEwMzY2LTAuMTAzNjUgMC4yNzA1NCAwIDAuMzc0MTcgMC4xMDM2NCAwLjEwMzY3IDAuMjcwNTMgMC4xMDM2NyAwLjM3NDE3IDBsMC4zNzQxOC0wLjM3NDE3IDAuMzc0MTggMC4zNzQxN2MwLjEwMzY0IDAuMTAzNjcgMC4yNzA1MyAwLjEwMzY3IDAuMzc0MTcgMCAwLjEwMzY1LTAuMTAzNjMgMC4xMDM2NS0wLjI3MDUxIDAtMC4zNzQxN2wtMC4zNzQxNy0wLjM3NDE3IDAuMzc0MTctMC4zNzQxOGMwLjEwMzY1LTAuMTAzNjYgMC4xMDM2NS0wLjI3MDUzIDAtMC4zNzQxNy0wLjEwMzY0LTAuMTAzNjctMC4yNzA1My0wLjEwMzY3LTAuMzc0MTcgMGwtMC4zNzQxOCAwLjM3NDE3LTAuMzc0MTgtMC4zNzQxN2MtMC4xMDM2NC0wLjEwMzY3LTAuMjcwNTMtMC4xMDM2Ny0wLjM3NDE3IDB6IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IiBvcGFjaXR5PSIuNSIvPgogPC9nPgo8L3N2Zz4K");
                    --svg-close-active: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0zMjIgLTU4MC41MikiPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4zNDAxOCAwIDAgLjM0MDE4IDg0LjkzMSAxNTMuMzMpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiPgogICAgPGcgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICA8cGF0aCBkPSJtMTIuMDAzIDEwNDUuOWMzLjAwNjggMCA1LjQ0NDQtMi40Mzc2IDUuNDQ0NC01LjQ0NDVzLTIuNDM3Ni01LjQ0NDQtNS40NDQ0LTUuNDQ0NGMtMy4wMDY5IDAtNS40NDQ1IDIuNDM3NS01LjQ0NDUgNS40NDQ0czIuNDM3NiA1LjQ0NDUgNS40NDQ1IDUuNDQ0NSIgZmlsbD0iI2NiNGU0MyIgc3Ryb2tlLXdpZHRoPSIuNzc3NzgiLz4KICAgIDwvZz4KICAgPC9nPgogIDwvZz4KICA8cGF0aCBkPSJtODYuNTY0IDE1NC45NmMtMC4xMDM2NSAwLjEwMzY0LTAuMTAzNjUgMC4yNzA1MSAwIDAuMzc0MTdsMC4zNzQxNyAwLjM3NDE4LTAuMzc0MTcgMC4zNzQxN2MtMC4xMDM2NSAwLjEwMzY2LTAuMTAzNjUgMC4yNzA1NCAwIDAuMzc0MTcgMC4xMDM2NCAwLjEwMzY3IDAuMjcwNTMgMC4xMDM2NyAwLjM3NDE3IDBsMC4zNzQxOC0wLjM3NDE3IDAuMzc0MTggMC4zNzQxN2MwLjEwMzY0IDAuMTAzNjcgMC4yNzA1MyAwLjEwMzY3IDAuMzc0MTcgMCAwLjEwMzY1LTAuMTAzNjMgMC4xMDM2NS0wLjI3MDUxIDAtMC4zNzQxN2wtMC4zNzQxNy0wLjM3NDE3IDAuMzc0MTctMC4zNzQxOGMwLjEwMzY1LTAuMTAzNjYgMC4xMDM2NS0wLjI3MDUzIDAtMC4zNzQxNy0wLjEwMzY0LTAuMTAzNjctMC4yNzA1My0wLjEwMzY3LTAuMzc0MTcgMGwtMC4zNzQxOCAwLjM3NDE3LTAuMzc0MTgtMC4zNzQxN2MtMC4xMDM2NC0wLjEwMzY3LTAuMjcwNTMtMC4xMDM2Ny0wLjM3NDE3IDB6IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IiBvcGFjaXR5PSIuNSIvPgogPC9nPgo8L3N2Zz4K");
                    --svg-max: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIGlkPSJ0aXRsZWJ1dHRvbi1tYXhpbWl6ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI3MywyNDIuNjQpIj4KICA8cmVjdCB4PSIyNzMiIHk9Ii0yNDIuNjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgcnk9IjEuNjkzMWUtNSIgb3BhY2l0eT0iMCIgc3Ryb2tlLXdpZHRoPSIuNDc0MzIiIHN0eWxlPSJwYWludC1vcmRlcjptYXJrZXJzIHN0cm9rZSBmaWxsIi8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjc0LC0yNDEuNjQpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICA8cGF0aCBkPSJtMTIgMTA0Ny40YzMuODY1OSAwIDYuOTk5OS0zLjEzNCA2Ljk5OTktN3MtMy4xMzQtNy02Ljk5OTktN2MtMy44NjYgMC03LjAwMDEgMy4xMzQtNy4wMDAxIDdzMy4xMzQgNyA3LjAwMDEgNyIgZmlsbD0iIzIwYTkzMiIvPgogICAgPHBhdGggZD0ibTEyIDEwNDYuOWMzLjU4OTggMCA2LjQ5OTktMi45MTAzIDYuNDk5OS02LjUwMDEgMC0zLjU4OTktMi45MTAyLTYuNS02LjQ5OTktNi41LTMuNTg5OSAwLTYuNTAwMSAyLjkxMDEtNi41MDAxIDYuNSAwIDMuNTg5OCAyLjkxMDIgNi41MDAxIDYuNTAwMSA2LjUwMDEiIGZpbGw9IiMyOGQzM2YiLz4KICAgPC9nPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==");
                    --svg-max-hover: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0yOTcgLTU4NS41MykiPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMS45MDYsMzEuMjIxKSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgPHBhdGggZD0ibTkyLjYwNSAxMjcuNjdjMS4wMjI5IDAgMS44NTIxLTAuODI5MTkgMS44NTIxLTEuODUyMSAwLTEuMDIyOS0wLjgyOTItMS44NTIxLTEuODUyMS0xLjg1MjFzLTEuODUyMSAwLjgyOTItMS44NTIxIDEuODUyMSAwLjgyOTIgMS44NTIxIDEuODUyMSAxLjg1MjEiIGZpbGw9IiMyMGE5MzIiIHN0cm9rZS13aWR0aD0iLjc3Nzc4Ii8+CiAgIDxwYXRoIGQ9Im05Mi42MDUgMTI3LjU0YzAuOTQ5NzggMCAxLjcxOTgtMC43NzAwNiAxLjcxOTgtMS43MTk4IDAtMC45NDk4Ni0wLjc2OTk5LTEuNzE5OC0xLjcxOTgtMS43MTk4LTAuOTQ5ODUgMC0xLjcxOTggMC43Njk5OS0xLjcxOTggMS43MTk4IDAgMC45NDk3OCAwLjc2OTk5IDEuNzE5OCAxLjcxOTggMS43MTk4IiBmaWxsPSIjMjhkMzNmIiBzdHJva2Utd2lkdGg9Ii43NjQ3MSIvPgogIDwvZz4KICA8cGF0aCBkPSJtODAuMjc4IDE1Ni4yNCAxLjIxMzQgMS4yMTM0di0wLjk0ODc3YzAtMC4xMDk5NC0wLjE1NDY1LTAuMjY0NTgtMC4yNjQ1OS0wLjI2NDU4em0tMC4zNzQxMyAwLjM3NDE0djAuOTQ4NzdjMCAwLjEwOTk0IDAuMTU0NjQgMC4yNjQ1OSAwLjI2NDU4IDAuMjY0NTloMC45NDg3OHoiIG9wYWNpdHk9Ii41Ii8+CiA8L2c+Cjwvc3ZnPgo=");
                    --svg-max-active: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSwwLDAsMy43Nzk1LC0yOTYsLTU4Ni41MikiPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMS45MDYsMzEuMjIxKSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgPHBhdGggZD0ibTkyLjM0IDEyNy45M2MxLjAyMjkgMCAxLjg1MjEtMC44MjkyMyAxLjg1MjEtMS44NTIxIDAtMS4wMjI5LTAuODI5MjEtMS44NTIxLTEuODUyMS0xLjg1MjEtMS4wMjI5IDAtMS44NTIxIDAuODI5MjMtMS44NTIxIDEuODUyMSAwIDEuMDIyOSAwLjgyOTIxIDEuODUyMSAxLjg1MjEgMS44NTIxIiBmaWxsPSIjMjBhOTMyIiBzdHJva2Utd2lkdGg9Ii43Nzc4MSIvPgogIDwvZz4KICA8cGF0aCBkPSJtODAuMDE0IDE1Ni41MSAxLjIxMzQgMS4yMTM0di0wLjk0ODc3YzAtMC4xMDk5NC0wLjE1NDY1LTAuMjY0NTgtMC4yNjQ1OS0wLjI2NDU4em0tMC4zNzQxMyAwLjM3NDE0djAuOTQ4NzdjMCAwLjEwOTk0IDAuMTU0NjQgMC4yNjQ1OSAwLjI2NDU4IDAuMjY0NTloMC45NDg3OHoiIG9wYWNpdHk9Ii41Ii8+CiA8L2c+Cjwvc3ZnPgo=");
                    --svg-unmax: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIGlkPSJ0aXRsZWJ1dHRvbi1tYXhpbWl6ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI3MywyNDIuNjQpIj4KICA8cmVjdCB4PSIyNzMiIHk9Ii0yNDIuNjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgcnk9IjEuNjkzMWUtNSIgb3BhY2l0eT0iMCIgc3Ryb2tlLXdpZHRoPSIuNDc0MzIiIHN0eWxlPSJwYWludC1vcmRlcjptYXJrZXJzIHN0cm9rZSBmaWxsIi8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjc0LC0yNDEuNjQpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICA8cGF0aCBkPSJtMTIgMTA0Ny40YzMuODY1OSAwIDYuOTk5OS0zLjEzNCA2Ljk5OTktN3MtMy4xMzQtNy02Ljk5OTktN2MtMy44NjYgMC03LjAwMDEgMy4xMzQtNy4wMDAxIDdzMy4xMzQgNyA3LjAwMDEgNyIgZmlsbD0iIzIwYTkzMiIvPgogICAgPHBhdGggZD0ibTEyIDEwNDYuOWMzLjU4OTggMCA2LjQ5OTktMi45MTAzIDYuNDk5OS02LjUwMDEgMC0zLjU4OTktMi45MTAyLTYuNS02LjQ5OTktNi41LTMuNTg5OSAwLTYuNTAwMSAyLjkxMDEtNi41MDAxIDYuNSAwIDMuNTg5OCAyLjkxMDIgNi41MDAxIDYuNTAwMSA2LjUwMDEiIGZpbGw9IiMyOGQzM2YiLz4KICAgPC9nPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==");
                    --svg-unmax-hover: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0zNDIgLTQ2Ny41MykiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgPHBhdGggZD0ibTkyLjYwNSAxMjcuNjdjMS4wMjI5IDAgMS44NTIxLTAuODI5MTkgMS44NTIxLTEuODUyMSAwLTEuMDIyOS0wLjgyOTItMS44NTIxLTEuODUyMS0xLjg1MjFzLTEuODUyMSAwLjgyOTItMS44NTIxIDEuODUyMSAwLjgyOTIgMS44NTIxIDEuODUyMSAxLjg1MjEiIGZpbGw9IiMyMGE5MzIiIHN0cm9rZS13aWR0aD0iLjc3Nzc4Ii8+CiAgPHBhdGggZD0ibTkyLjYwNSAxMjcuNTRjMC45NDk3OCAwIDEuNzE5OC0wLjc3MDA2IDEuNzE5OC0xLjcxOTggMC0wLjk0OTg2LTAuNzY5OTktMS43MTk4LTEuNzE5OC0xLjcxOTgtMC45NDk4NSAwLTEuNzE5OCAwLjc2OTk5LTEuNzE5OCAxLjcxOTggMCAwLjk0OTc4IDAuNzY5OTkgMS43MTk4IDEuNzE5OCAxLjcxOTgiIGZpbGw9IiMyOGQzM2YiBzdHJva2Utd2lkdGg9Ii43NjQ3MSIvPgogIDwvZz4KICA8cGF0aCBkPSJtOC4wMjU0IDMuNDE0MXYzLjU4NTljMCAwLjQxNTUyIDAuNTg0NDggMSAxIDFoMy41ODU5em0tNC42MzY3IDQuNTg1OSA0LjU4NTkgNC41ODU5di0zLjU4NTljMC0wLjQxNTUyLTAuNTg0NDgtMS0xLTF6IiBvcGFjaXR5PSIuNSIgc3Ryb2tlLXdpZHRoPSIzLjc3OTUiLz4KPC9zdmc+Cg==");
                    --svg-unmax-active: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0zNDEgLTQ2OC41MikiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgPHBhdGggZD0ibTkyLjM0IDEyNy45M2MxLjAyMjkgMCAxLjg1MjEtMC44MjkyMyAxLjg1MjEtMS44NTIxIDAtMS4wMjI5LTAuODI5MjEtMS44NTIxLTEuODUyMS0xLjg1MjEtMS4wMjI5IDAtMS44NTIxIDAuODI5MjMtMS44NTIxIDEuODUyMSAwIDEuMDIyOSAwLjgyOTIxIDEuODUyMSAxLjg1MjEgMS44NTIxIiBmaWxsPSIjMjBhOTMyIiBzdHJva2Utd2lkdGg9Ii43Nzc4MSIvPgogPC9nPgogPHBhdGggZD0ibTguMDI1NCAzLjQxNDF2My41ODU5YzAgMC40MTU1MiAwLjU4NDQ4IDEgMSAxaDMuNTg1OWwtNC41ODU5LTQuNTg1OXptLTQuNjM2NyA0LjU4NTkgNC41ODU5IDQuNTg1OXYtMy41ODU5YzAtMC40MTU1Mi0wLjU4NDQ4LTEtMS0xaC0zLjU4NTl6IiBvcGFjaXR5PSIuNSIgc3Ryb2tlLXdpZHRoPSIzLjc3OTUiLz4KPC9zdmc+Cg==");
                    --svg-min: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIGlkPSJ0aXRsZWJ1dHRvbi1taW5pbWl6ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI1MywyNDIuNjQpIj4KICA8cmVjdCB4PSIyNTMiIHk9Ii0yNDIuNjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgcnk9IjEuNjkzMWUtNSIgb3BhY2l0eT0iMCIgc3Ryb2tlLXdpZHRoPSIuNDc0MzIiIHN0eWxlPSJwYWludC1vcmRlcjptYXJrZXJzIHN0cm9rZSBmaWxsIi8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjU0LC0yNDEuNjQpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICA8cGF0aCBkPSJtMTIgMTA0Ny40YzMuODY1OSAwIDYuOTk5OS0zLjEzNCA2Ljk5OTktN3MtMy4xMzQtNy02Ljk5OTktN2MtMy44NjYgMC03LjAwMDEgMy4xMzQtNy4wMDAxIDdzMy4xMzQgNyA3LjAwMDEgNyIgZmlsbD0iI2NhYTEyNCIvPgogICAgPHBhdGggZD0ibTEyIDEwNDYuOWMzLjU4OTggMCA2LjQ5OTktMi45MTAzIDYuNDk5OS02LjUwMDEgMC0zLjU4OTktMi45MTAyLTYuNS02LjQ5OTktNi41LTMuNTg5OSAwLTYuNTAwMSAyLjkxMDEtNi41MDAxIDYuNSAwIDMuNTg5OCAyLjkxMDIgNi41MDAxIDYuNTAwMSA2LjUwMDEiIGZpbGw9IiNmZGM5MmQiLz4KICAgPC9nPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==");
                    --svg-min-hover: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSAwIDAgMy43Nzk1IC0yNjYgLTU4NC41MikiPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4yNjQ2NSAwIDAgLjI2NDY1IDcwLjY0MyAxNTQuOTIpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICA8cGF0aCBkPSJtMTIuMDAzIDEwNDcuNGMzLjg2NSAwIDYuOTk4Mi0zLjEzMzIgNi45OTgyLTYuOTk4M3MtMy4xMzMzLTYuOTk4NC02Ljk5ODItNi45OTg0Yy0zLjg2NTEgMC02Ljk5ODQgMy4xMzMyLTYuOTk4NCA2Ljk5ODQgMCAzLjg2NSAzLjEzMzMgNi45OTgzIDYuOTk4NCA2Ljk5ODMiIGZpbGw9IiNjYWExMjQiIHN0cm9rZS13aWR0aD0iLjc3Nzc4Ii8+CiAgICA8cGF0aCBkPSJtMTIuMDAzIDEwNDYuOWMzLjU4ODkgMCA2LjQ5ODMtMi45MDk2IDYuNDk4My02LjQ5ODZzLTIuOTA5NS02LjQ5ODQtNi40OTgzLTYuNDk4NGMtMy41ODkxIDAtNi40OTg1IDIuOTA5NC02LjQ5ODUgNi40OTg0czIuOTA5NSA2LjQ5ODYgNi40OTg1IDYuNDk4NiIgZmlsbD0iI2ZkYzkyZCIgc3Ryb2tlLXdpZHRoPSIuNzY0NzEiLz4KICAgPC9nPgogIDwvZz4KICA8cmVjdCB4PSI3MS40MzgiIHk9IjE1Ni41MSIgd2lkdGg9IjIuMTE2NyIgaGVpZ2h0PSIuNTI5MTciIHJ5PSIuMjY0NTgiIG9wYWNpdHk9Ii41Ii8+CiA8L2c+Cjwvc3ZnPgo=");
                    --svg-min-active: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDMuNzc5NSwwLDAsMy43Nzk1LC0yNjUsLTU4NS41MikiPgogIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4yNjQ2NSAwIDAgLjI2NDY1IDcwLjY0MyAxNTQuOTIpIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3Ij4KICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUsLTEwMzMuNCkiPgogICAgPGcgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICA8cGF0aCBkPSJtMTEuMDAzIDEwNDguNGMzLjg2NSAwIDYuOTk4Mi0zLjEzMzIgNi45OTgyLTYuOTk4M3MtMy4xMzMzLTYuOTk4NC02Ljk5ODItNi45OTg0Yy0zLjg2NSAwLTYuOTk4MyAzLjEzMzItNi45OTgzIDYuOTk4NCAwIDMuODY1IDMuMTMzMyA2Ljk5ODMgNi45OTgzIDYuOTk4MyIgZmlsbD0iI2NhYTEyNCIgc3Ryb2tlLXdpZHRoPSIuNzc3NzgiLz4KICAgIDwvZz4KICAgPC9nPgogIDwvZz4KICA8cmVjdCB4PSI3MS4xNzMiIHk9IjE1Ni43NyIgd2lkdGg9IjIuMTE2NyIgaGVpZ2h0PSIuNTI5MTciIHJ5PSIuMjY0NTgiIG9wYWNpdHk9Ii41Ii8+CiA8L2c+Cjwvc3ZnPgo=");
                }
                .global-container .topbar .user-profile-card__widgets,
                .window-control-area_btn[aria-label*="天气"],
                .window-control-area_btn[aria-label*="小程序"],
                .window-control-area__btn[aria-label*="天气"],
                .window-control-area__btn[aria-label*="小程序"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    function processButtons() {
        injectCssVariables();
        
        const controlArea = findWindowControlArea();
        if (controlArea) {
            const allBtns = controlArea.querySelectorAll('.window-control-area_btn, .window-control-area__btn, .titlebar-button');
            allBtns.forEach(btn => {
                const ariaLabel = btn.getAttribute('aria-label') || '';
                const textContent = btn.textContent || '';
                if (ariaLabel.includes('天气') || ariaLabel.includes('小程序') || 
                    textContent.includes('天气') || textContent.includes('小程序')) {
                    btn.style.display = 'none';
                }
            });
        }
        
        const weatherWidget = document.querySelector('.global-container .topbar .user-profile-card__widgets');
        if (weatherWidget) {
            weatherWidget.style.display = 'none';
        }
        
        const buttons = findWindowButtons();
        
        if (buttons.length === 0) return;
        
        buttons.forEach(btn => {
            if (btn.hasAttribute('data-whitesur-processed')) return;
            
            let type = getButtonType(btn);
            
            if (!type) {
                type = getButtonTypeByPosition(buttons, btn);
            }
            
            if (type) {
                replaceButton(btn, type);
            }
        });
    }

    setInterval(() => {
        processButtons();
    }, 500);

    const observer = new MutationObserver(() => {
        processButtons();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
})();
