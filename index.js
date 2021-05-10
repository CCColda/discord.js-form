/**
 * Creates a form on `message`.
 * @throws If message, or buttons is empty, or if the user
 *         doesn't have ADD_REACTIONS privileges in the channel of `message`.
 * @param {import('discord.js').Message} message 
 * @param {string[]} buttons 
 * @param {import('.').TCallbackMapLike} callbacks 
 * @returns {import('.').IForm}
 */
const createForm = (message, buttons, callbacks) => {
    if (!message) throw Error("Missing message for discordForm");
    if (!buttons) throw Error("Missing buttons for discordForm");

    if (!message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS'))
        throw Error("Missing ADD_REACTIONS privilege");

    let formButtons = buttons.slice();

    /** @type {import('.').TCallbackMap} */
    let formCallbacks = callbacks instanceof Map
        ? new Map(callbacks)
        : new Map(Object.entries(callbacks || {}));

    let formMessage = message;

    let formCollector = formMessage.createReactionCollector(
        (_react, user) => user != formMessage.guild.me.user,
        {}
    );

    /** @type {Map<string, Set<User>>} */
    let reactionCache = new Map();

    /** @type {Promise<void> | undefined} */
    let reactPromise = undefined;

    /**
     * Adds reacts from startIndex to the end.
     * @param {number} startIndex Index to start adding the reactions from
     * @returns {Promise<void>}
     */
    async function add_reacts(startIndex) {
        for (let i = startIndex; i < formButtons.length; ++i) {
            if (formCollector.ended)
                break;
            await formMessage.react(formButtons[i]);
        }
    }

    /**
     * Swaps button_a with button_b, updates reactions accordingly.
     * Returns -1 if formCallbacks doesn't contain either of the buttons.
     * @param {string} button_a 
     * @param {string} button_b 
     * @returns {Promise<(-1 | 0)>}
     */
    async function interface_swap(button_a, button_b) {
        if (!formCallbacks.has(button_a) ||
            !formCallbacks.has(button_b))
            return -1;

        const indexA = formButtons.findIndex(v => v == button_a);

        await reactPromise;

        for (let i = indexA; i < formButtons.length; ++i) {
            reactionCache.delete(formButtons[i]);
            await formMessage.reactions.resolve(formButtons[i]).remove();
        }

        formButtons[indexA] = button_b;

        reactPromise = add_reacts(indexA);

        return 0;
    }

    /**
     * Stops the reaction collector.
     * @returns {void}
     */
    function interface_stop() {
        formCollector.stop();
    }

    /**
     * Clears all reactions.
     * @returns {Promise<void>}
     */
    async function interface_clear() {
        await reactPromise;
        reactionCache.clear();
        await formMessage.reactions.removeAll();
    }

    /**
     * Resets the buttons, removes all reactions not from the bot.
     * @returns {Promise<void>}
     */
    async function interface_reset() {
        await reactPromise;
        reactionCache.clear();

        for (const button of formButtons) {
            const resolved = formMessage.reactions.resolve(button);

            if (resolved) {
                const users = await resolved.users.fetch();

                users.array()
                    .filter(u => u != formMessage.guild.me.user)
                    .forEach(async u => await resolved.users.remove(u));
            }
        }
    }

    /**
     * Sets the callback for `button`
     * @param {string} button 
     * @param {import('.').TCallback} callback 
     */
    function interface_set_callback(button, callback) {
        formCallbacks.set(button, callback);
    }

    /**
     * Adds a new button at index.
     * If index is -1, the button gets pushed at the end of the list.
     * @param {string} button 
     * @param {number} index 
     * @returns {Promise<void>}
     */
    async function interface_add_button(button, index = -1) {
        if (index == -1)
            index = formButtons.length;

        await reactPromise;
        for (let i = index; i < formButtons.length; ++i) {
            reactionCache.delete(formButtons[i]);
            await formMessage.reactions.resolve(formButtons[i]).remove();
        }

        formButtons.splice(index, 0, button);

        reactPromise = add_reacts(index);
    }

    /**
     * Returns an existing button. If `button` doesn't exist, returns -1
     * @param {string} button 
     * @returns {Promise<number>}
     */
    async function interface_remove_button(button) {
        const buttonIndex = formButtons.indexOf(button);

        if (buttonIndex == -1)
            return -1;

        await reactPromise;
        for (let i = buttonIndex; i < formButtons.length; ++i) {
            reactionCache.delete(formButtons[i]);
            await formMessage.reactions.resolve(formButtons[i]).remove();
        }

        formButtons.splice(buttonIndex, 1);

        reactPromise = add_reacts(buttonIndex);
        return 0;
    }

    /**
     * Overrides the buttons, deletes and resends reactions
     * @param {string[]} new_buttons 
     * @returns {Promise<void>}
     */
    async function interface_set_buttons(new_buttons) {
        let sameUntil = 0;

        for (sameUntil = 0; sameUntil < Math.min(new_buttons.length, formButtons.length); ++sameUntil)
            if (formButtons[sameUntil] != new_buttons[sameUntil])
                break;

        await reactPromise;

        if (sameUntil == 0) {
            reactionCache.clear();
            await formMessage.reactions.removeAll();
        }
        else {
            for (let i = sameUntil; i < formButtons.length; ++i) {
                reactionCache.delete(formButtons[i]);
                await formMessage.reactions.resolve(formButtons[i]).remove();
            }
        }

        formButtons = new_buttons.slice();

        reactPromise = add_reacts(sameUntil);
    }

    /**
     * Returns a map of cached reactions, excluding the ones from the client.
     * @returns {Map<string, User[]>}
     */
    function interface_get_reactions() {
        const cacheEntries = [...reactionCache.entries()];
        let transformArray = [];

        for (let buttonIndex in formButtons) {
            const buttonIndexInCache = cacheEntries.findIndex(([v]) => v == formButtons[buttonIndex]);
            if (buttonIndexInCache != -1)
                transformArray.push([
                    cacheEntries[buttonIndexInCache][0],
                    [...(cacheEntries[buttonIndexInCache][1].values())]
                ]);
            else
                transformArray.push([formButtons[buttonIndex], []]);
        }

        return new Map(transformArray);
    }

    /**
     * Fetches a map of all the reactions (excluding the client).
     * Doesn't modify the cache.
     * @returns {Promise<Map<string, User[]>>}
     */
    async function interface_fetch_reactions() {
        let result = new Map();

        await reactPromise;

        for (const button of formButtons) {
            const resolved = formMessage.reactions.resolve(button);

            if (resolved) {
                const users = await resolved.users.fetch();

                result.set(button, users.array().filter(u => u != formMessage.guild.me.user));
            }
        }

        return result;
    }

    const formInterface = {
        get message() { return formMessage },
        get channel() { return formMessage.channel },
        get buttons() { return formButtons },
        get callbacks() { return formCallbacks },
        swap: interface_swap,
        stop: interface_stop,
        clear: interface_clear,
        reset: interface_reset,
        transfer: null,
        setCallback: interface_set_callback,
        addButton: interface_add_button,
        removeButton: interface_remove_button,
        setButtons: interface_set_buttons,
        getReactions: interface_get_reactions,
        fetchReactions: interface_fetch_reactions,
        waitReactions: () => reactPromise
    };

    /**
     * Transfer the whole interface to another message.
     * @throws If the client does not have permissions to add reactions in the channel of the new message.
     * @param {Message} new_message
     * @returns {Promise<void>}
     */
    async function interface_transfer(new_message) {
        if (!message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS'))
            throw Error("Missing ADD_REACTIONS privilege");

        await reactPromise;

        let newFormCollector = new_message.createReactionCollector(
            (_react, user) => user != formMessage.guild.me.user,
            {}
        );

        formCollector.stop();
        reactionCache.clear();

        formMessage = new_message;
        formCollector = newFormCollector;

        formCollector.on('collect', async (react, user) => {
            if (formButtons.some(v => v == react.emoji.name)) {
                if (reactionCache.has(react.emoji.name))
                    reactionCache.get(react.emoji.name).add(user);
                else
                    reactionCache.set(react.emoji.name, new Set([user]));

                if (formCallbacks.has(react.emoji.name))
                    formCallbacks.get(react.emoji.name)(user, formInterface);
            }
            else {
                await react.users.remove(user);
            }
        });

        formCollector.on('remove', async (react, user) => {
            if (formButtons.some(v => v == react.emoji.name))
                if (reactionCache.has(react.emoji.name))
                    reactionCache.get(react.emoji.name).delete(user);
        });

        reactPromise = add_reacts(0);
    }

    formInterface.transfer = interface_transfer;

    formCollector.on('collect', async (react, user) => {
        if (formButtons.some(v => v == react.emoji.name)) {
            if (reactionCache.has(react.emoji.name))
                reactionCache.get(react.emoji.name).add(user);
            else
                reactionCache.set(react.emoji.name, new Set([user]));

            if (formCallbacks.has(react.emoji.name))
                formCallbacks.get(react.emoji.name)(user, formInterface);
        }
        else {
            // Remove unspecified reactions
            await react.users.remove(user);
        }
    });

    formCollector.on('remove', async (react, user) => {
        if (formButtons.some(v => v == react.emoji.name))
            if (reactionCache.has(react.emoji.name))
                reactionCache.get(react.emoji.name).delete(user);
    });

    reactPromise = add_reacts(0);

    return formInterface;
};

/**
 * Creates a form on a new message.
 * @throws If message, or buttons is empty, or if the user
 *         doesn't have ADD_REACTIONS or SEND_MESSAGES privileges in the channel.
 * @param {import('discord.js').MessageTarget} channel 
 * @param {import('.').TMessageContent} content 
 * @param {string[]} buttons 
 * @param {import('.').TCallbackMapLike} callbacks 
 * @return {import('.').IForm} 
 */
const createFormMessage = async (channel, content, buttons, callbacks) => {
    if (!channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES'))
        throw Exception("Missing SEND_MESSAGES privilege");

    const { content: msg_content, extra_content: msg_extra_content } = content instanceof String || typeof content === "string"
        ? { content, extra_content: undefined }
        : content;

    const message = await channel.send(msg_content, msg_extra_content);

    return createForm(message, buttons, callbacks);
}

module.exports = {
    createForm,
    createFormMessage
};