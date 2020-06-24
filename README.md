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

# Usage Example
*Scrolling lists*

### JavaScript

```javascript
const discordForm = require('discord.js-form');

const scrollingList = {
    pages: [ /* page contents here */ ],
    pageIndex: 0
};

discordForm.createFormMessage(
    msg.channel,
    { content: scrollingList.pages[0] },
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
    { content: scrollingList.pages[0] },
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

# License
This project is under the MIT license.