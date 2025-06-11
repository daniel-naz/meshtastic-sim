/**
 * Get menu tab, create one if it doesn't exist.
 * @param {string} tabName The tab title.
 */
function getCreateTab(tabName) {
    let tab = document.getElementById(tabName);

    if (!tab) {
        const menu = document.getElementById('topmenu');

        const dropbtn = Object.assign(document.createElement('button'), {
            innerText: tabName,
            className: 'dropbtn',
        });

        tab = Object.assign(document.createElement('div'), {
            id: tabName,
            className: 'dropdown-content',
        });

        const tabdiv = document.createElement('div');
        tabdiv.className = 'dropdown';
        tabdiv.append(dropbtn, tab);

        menu.appendChild(tabdiv);
    }

    return tab
}

/**
 * Add a new menu button.
 * @param {string} tabName The tab title.
 * @param {string} buttonName The button title.
 * @param {()} onclick On click behaviour.
 */
function createMenuDropdownButton(tabName, buttonName, onclick, ...args) {
    const btn = Object.assign(document.createElement('a'), {
        innerText: buttonName,
        id: buttonName,
        href: '#',
        onclick: () => {
            onclick(args)
        }
    });

    const tab = getCreateTab(tabName)
    tab.appendChild(btn);
}

/**
 * Add a new menu button.
 * @param {string} buttonName The button title.
 * @param {()} onclick On click behaviour.
 */
function createMenuButton(buttonName, onclick, ...args) {
    const btn = Object.assign(document.createElement('button'), {
        innerText: buttonName,
        id: buttonName,
        href: '#',
        onclick: () => {
            onclick(args)
        }
    }); 
    btn.classList.add("button")

    let wrapper = document.getElementById("alignright") 
    if(!wrapper){
        wrapper = document.createElement('div')
        wrapper.classList.add("align-right")
        wrapper.id = "alignright"

        const menu = document.getElementById('topmenu');
        menu.appendChild(wrapper)
    }

    wrapper.appendChild(btn)
}

export default {
    createMenuDropdownButton,
    createMenuButton
}