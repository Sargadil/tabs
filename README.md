# Tabs a11y

A package for building tabs that comply with WCAG accessibility guidelines. The tabs can be navigated using both a mouse and a keyboard. The package also includes various configuration options.

## Basic usage

### Without npm
- Navigate to the project repository and download it. Place it in the appropriate directory, such as a library folder
- Include the following scripts:
  - js: `tabs-a11y/dist/js/script.min.css`
  - css: `tabs-a11y/dist/css/style.min.css`

### With npm

#### Add css
Include the css file from `dist/css/style.min.css`

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
Include the js file from `dist/js/script.min.css`

or 

```javascript

//commonjs
var tabs = require('tabs-a11y');

new tabs();
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
    }
}
```

### Configuration description

| Option                      | Type    | Description                                                                                                                     |
|-----------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------|
| contextID                   | string  | Main Container ID.                                                                                                              |
| classes.tabsNavContainer    | string  | Navigation tabs container css class. Use this only when you want create custom navigation.                                      |
| classes.tabsNavList         | string  | Navigation tabs list css class. Use this only when you want create custom navigation.                                           |
| classes.tabsNavButton       | string  | Navigation tabs buttons css class. Use this only when you want create custom navigation.                                        |
| classes.tabPanel            | string  | Single tab panel css class.                                                                                                     |
| classes.tabPanelTitle       | string  | Single tab title panel css class. This text will be copy to navigation button.                                                  |
| selectors.tabPanelIdPrefix  | string  | Selector that will be used as ID prefix to add correct aria structure for accessibility.                                        |
| selectors.tabPanelOpen      | string  | Selector that will be used as css class to indicate open tab panel.                                                             |
| options.useCustomNav        | boolean | Indicate if should use custom tabs navigation. Important note is that you have to put your css classes to configuration object. |
| options.customNavTitles     | array   | Array with custom titles.                                                                                                       |
| options.initSelectedItem    | number  | Indicate which tab should be open on initial state. Count start from 0.                                                         |
| options.removeTabPanelTitle | boolean | Indicate if we should remove title from tab panel that will be moved to navigation tab buttons.                                 |


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
```html
<div class="tabs" id="tabs">
    <div class="custom-tabs__nav">
        <div class="custom-tabs__nav-inner">
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
