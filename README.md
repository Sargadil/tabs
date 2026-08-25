# Tabs a11y

A package for building tabs that comply with WCAG accessibility guidelines. The tabs can be navigated using both a mouse and a keyboard. The package also includes various configuration options.

## Basic usage

### Without npm
- Navigate to the project repository and download it. Place it in the appropriate directory, such as a library folder
- Include the following scripts:
  - js: `tabs-a11y/dist/js/tabs-a11y.umd.js` (exposes a `Tabs` global)
  - css: `tabs-a11y/dist/css/styles.min.css`

### With npm

#### Add css
Include the css file from `dist/css/styles.min.css`. Below 600px wide, the nav becomes a
horizontally scrollable strip (instead of wrapping, or staying a tall vertical list with
`tabs--vertical`) so the tab content never gets pushed out of view on a phone.

#### Create HTML structure
```html
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title">Aliquid architecto</h3>
            <div class="tab-panel__content">Assumenda dolores est fuga id iure minima non rem repellat, ullam voluptatem.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Consectetur deserunt</h3>
            <div class="tab-panel__content">Accusantium adipisci animi consectetur delectus dolor dolores, magni molestiae nulla odit quo saepe suscipit unde.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Ducimus</h3>
            <div class="tab-panel__content">In libero molestiae odio odit perferendis praesentium repellat sed vero voluptatum? Eius quidem recusandae sapiente?</div>
        </div>
    </div>
</div>
```

#### Add javascript
Include the js file from `dist/js/tabs-a11y.umd.js`

or

```javascript
//commonjs
const Tabs = require('tabs-a11y');

new Tabs();
```

```javascript
//esm
import Tabs from 'tabs-a11y';

new Tabs();
```

## API

### `destroy()`
Removes all event listeners added by the instance. Call this before discarding a `Tabs`
instance (e.g. on component unmount in a framework like React or Vue) to avoid leaking
listeners.

```javascript
const tabs = new Tabs();

// later, e.g. when the component unmounts
tabs.destroy();
```

### `selectTab(index)`
Programmatically select a tab by index (0-based). Throws if no tab exists at that index.

```javascript
const tabs = new Tabs();

tabs.selectTab(2);
```

### `getSelectedIndex()`
Returns the index of the currently selected tab.

```javascript
const tabs = new Tabs();

tabs.getSelectedIndex(); // 0
```

### `tabs:change` event
Dispatched (bubbling) on the main container element whenever the selected tab changes,
whether triggered by mouse, keyboard, or `selectTab()`. Useful for analytics or for
lazy-loading panel content.

```javascript
document.getElementById('tabs').addEventListener('tabs:change', (event) => {
    const { index, tab, panel } = event.detail;

    console.log('Selected tab index:', index);
});
```

## Configuration

### Configuration object

```javascript
{
    contextID: 'tabs',
    classes: {
        tabsNavContainer: '.tabs__nav',
        tabsNavList: '.tabs__nav-list',
        tabsNavButton: '.tabs__nav-btn',
        tabPanel: '.tab-panel',
        tabPanelTitle: '.tab-panel__title',
    },
    selectors: {
        tabPanelIdPrefix: 'tabpanel',
        tabPanelOpen: 'tab-panel--open',
    },
    options: {
        useCustomNav: false,
        customNavTitles: [],
        initSelectedItem: 1,
        removeTabPanelTitle: false,
        ariaLabel: '',
        orientation: 'horizontal',
        activationMode: 'automatic',
    }
}
```

### Configuration description

| Option                      | Type    | Description                                                                                                                     |
|-----------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------|
| contextID                   | string \| HTMLElement | Main container: either its `id` (string), or a direct reference to the element — useful for elements without an `id` or created dynamically. |
| classes.tabsNavContainer    | string  | Navigation tabs container css class. Use this only when you want create custom navigation.                                      |
| classes.tabsNavList         | string  | Navigation tabs list css class. Use this only when you want create custom navigation.                                           |
| classes.tabsNavButton       | string  | Navigation tabs buttons css class. Use this only when you want create custom navigation.                                        |
| classes.tabPanel            | string  | Single tab panel css class.                                                                                                     |
| classes.tabPanelTitle       | string  | Single tab title panel css class. This text will be copy to navigation button.                                                  |
| selectors.tabPanelIdPrefix  | string  | Selector that will be used as ID prefix to add correct aria structure for accessibility. Safe to leave at the default even with multiple `Tabs` instances on the same page — a numeric suffix is added automatically if it would otherwise collide. |
| selectors.tabPanelOpen      | string  | Selector that will be used as css class to indicate open tab panel.                                                             |
| options.useCustomNav        | boolean | Indicate if should use custom tabs navigation. Important note is that you have to put your css classes to configuration object. |
| options.customNavTitles     | array   | Array with custom titles.                                                                                                       |
| options.initSelectedItem    | number  | Indicate which tab should be open on initial state. Count start from 0.                                                         |
| options.removeTabPanelTitle | boolean | Indicate if we should remove title from tab panel that will be moved to navigation tab buttons.                                 |
| options.ariaLabel           | string  | Accessible name (`aria-label`) for the tablist, e.g. `"Product details"`. Recommended when a page has more than one tab group.  |
| options.orientation         | string  | `'horizontal'` (default, `ArrowLeft`/`ArrowRight`) or `'vertical'` (`ArrowUp`/`ArrowDown`, sets `aria-orientation="vertical"`).  |
| options.activationMode      | string  | `'automatic'` (default) selects a tab as soon as it receives focus. `'manual'` moves focus with the arrow keys/Home/End without selecting; the focused tab is only activated on click, Enter, or Space. |

`orientation` only changes keyboard/ARIA behaviour, not layout. When using `'vertical'`, also add
the `tabs--vertical` class to the main container to lay the nav beside the panels instead of above
them (provided by the bundled `dist/css/styles.min.css`):

```html
<div class="tabs tabs--vertical" id="tabs">
```

Use `activationMode: 'manual'` when selecting a tab is expensive (e.g. it lazy-loads content) —
see the [`tabs:change`](#tabschange-event) event to hook into that.

`contextID` also accepts an element directly, which is handy when it wasn't created with an `id`:

```javascript
const container = document.querySelector('.my-tabs');

new Tabs({ contextID: container });
```


## Advance usage example

### Example 1 - Create nav custom title
You can use the **data-nav-title** attribute on the tabPanelTitle CSS class to copy its content to the navigation tabs button."

```html
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title" data-nav-title="This is a custom title 1">Aliquid architecto</h3>
            <div class="tab-panel__content">Assumenda dolores est fuga id iure minima non rem repellat, ullam voluptatem.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Consectetur deserunt</h3>
            <div class="tab-panel__content">Accusantium adipisci animi consectetur delectus dolor dolores, magni molestiae nulla odit quo saepe suscipit unde.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title" data-nav-title="This is a custom title 2">Ducimus</h3>
            <div class="tab-panel__content">In libero molestiae odio odit perferendis praesentium repellat sed vero voluptatum? Eius quidem recusandae sapiente?</div>
        </div>
    </div>
</div>
```


### Example 2 - Create own navigation tabs
Note: the library will add `role="tablist"` to the `tabsNavList` element (here `.custom-tabs__nav-inner`)
automatically if it's missing, but it's good practice to include it in your markup too.
```html
<div class="tabs" id="tabs">
    <div class="custom-tabs__nav">
        <div class="custom-tabs__nav-inner" role="tablist">
            <button class="custom-tabs__nav-button" role="tab">Tab 1</button>
            <button class="custom-tabs__nav-button" role="tab">Tab 2</button>
            <button class="custom-tabs__nav-button" role="tab">Tab 3</button>
        </div>
    </div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title">Aliquid architecto</h3>
            <div class="tab-panel__content">Assumenda dolores est fuga id iure minima non rem repellat, ullam voluptatem.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Consectetur deserunt</h3>
            <div class="tab-panel__content">Accusantium adipisci animi consectetur delectus dolor dolores, magni molestiae nulla odit quo saepe suscipit unde.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Ducimus</h3>
            <div class="tab-panel__content">In libero molestiae odio odit perferendis praesentium repellat sed vero voluptatum? Eius quidem recusandae sapiente?</div>
        </div>
    </div>
</div>
```

```javascript
//commonjs
var tabs = require('tabs-a11y');

new tabs({
    classes: {
        tabsNavContainer: '.custom-tabs__nav',
        tabsNavList: '.custom-tabs__nav-inner',
        tabsNavButton: '.custom-tabs__nav-button',
    },
    options: {
        useCustomNav: true,
    }
});
```


### Example 3 - Add custom title via config object
```html
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title" data-nav-title="This is a custom title 1">Aliquid architecto</h3>
            <div class="tab-panel__content">Assumenda dolores est fuga id iure minima non rem repellat, ullam voluptatem.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Consectetur deserunt</h3>
            <div class="tab-panel__content">Accusantium adipisci animi consectetur delectus dolor dolores, magni molestiae nulla odit quo saepe suscipit unde.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title" data-nav-title="This is a custom title 2">Ducimus</h3>
            <div class="tab-panel__content">In libero molestiae odio odit perferendis praesentium repellat sed vero voluptatum? Eius quidem recusandae sapiente?</div>
        </div>
    </div>
</div>
```

```javascript
//commonjs
var tabs = require('tabs-a11y');

new tabs({
    options: {
        customNavTitles: [
            'Custom title 1',
            'Custom title 2',
            'Custom title 3',
        ],
    } 
});
```
