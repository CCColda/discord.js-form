[![NPM](https://nodei.co/npm/discord.js-form.png)](https://nodei.co/npm/discord.js-form/)

# discord.js-form
An utility to create simple forms with reactions in discord. Supports both JavaScript and TypeScript. This could be used for:
 - simple yes / no questions
 - polls
 - music players
 - scrolling lists

# Installation
To install, open a shell at your bot directory and run:
```
npm i discord.js-form
```
---
This package was made for [**discord.js** ^12.2](https://discord.js.org/#/docs/main/12.2.0/general/welcome). If you do not have it installed, type:
```
npm i discord.js@^12.2
```

# Usage Example
## *Scrolling Lists*

### JavaScript

```javascript
const discordForm = require('discord.js-form');

const scrollingList = {
    pages: [ /* page contents here */ ],
    pageIndex: 0
};

discordForm.createFormMessage(
    msg.channel,
    scrollingList.pages[0], // Optionally { content: ... }
    [ '🔼', '🔽' ],
    {
        '🔽': async (user, form) => {
            if (scrollingList.pageIndex + 1 < scrollingList.pages.length)
                await form.message.edit(scrollingList.pages[++scrollingList.pageIndex]);

            // removes all reactions not from the user
            await form.reset();
        },
        '🔼': async (user, form) => {
            if (scrollingList.pageIndex > 0)
                await form.message.edit(scrollingList.pages[--scrollingList.pageIndex]);

            // removes all reactions not from the user
            await form.reset();
        }
    }
);
```

### TypeScript
```typescript
import { createFormMessage, IForm } from 'discord.js-form';
import { User } from 'discord.js';

const scrollingList = {
    pages: [ /* page contents here */ ],
    pageIndex: 0
};

createFormMessage(
    msg.channel,
    scrollingList.pages[0], // Optionally { content: ... }
    [ '🔼', '🔽' ],
    {
        '🔽': async (user: User, form: IForm) => {
            if (scrollingList.pageIndex + 1 < scrollingList.pages.length)
                await form.message.edit(scrollingList.pages[++scrollingList.pageIndex]);

            // removes all reactions not from the user
            await form.reset();
        },
        '🔼': async (user: User, form: IForm) => {
            if (scrollingList.pageIndex > 0)
                await form.message.edit(scrollingList.pages[--scrollingList.pageIndex]);

            // removes all reactions not from the user
            await form.reset();
        }
    }
);
```

## Preview
![Preview GIF](doc/preview.gif)

# Interface
| Function | Description |
|:--------:|:------------|
| `createForm` | Creates a form on a given message. |
| `createFormMessage` | Sends a message to the given channel, and returns createForm() on it. The second argument can either be a string, or an object with a `content` and `extra_content` property. |
---
| Function | Description |
|:--------:|:------------|
| `IForm.swap` | Swaps out an active button for another. |
| `IForm.stop` | Stops the reaction collector. |
| `IForm.reset` | Clears every reaction, except the ones from the client. |
| `IForm.clear` | Clears all reactions. |
| `IForm.transfer` | Transfers all the reactions and the reaction collector to another message. |
| `IForm.addButton` | Inserts a new reaction at the specified index. |
| `IForm.removeButton` | Removes the specified reaction. |
| `IForm.setButtons` | Clears previous buttons and sets them to the specified array. |
| `IForm.waitReactions` | Returns a promise which will resolve when all required reactions are added. |
| `IForm.getReactions` | Returns a map for each reaction not from the client from the cache. |
| `IForm.fetchReactions` | Fetches a map for each reaction not from the client. |
| `IForm.message` (getter) | Returns the message the form is operating on. |
| `IForm.buttons` (getter) | Returns the list of active buttons. |
| `IForm.callbacks` (getter) | Returns the map of callbacks for the current form. |

# License
This project is under the MIT license.