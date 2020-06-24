const createForm = (message, buttons, callbacks) => {
    if (! message) throw Error("Missing message for discordForm");
    if (! buttons) throw Error("Missing buttons for discordForm");
    if (! callbacks) throw Error("Missing callbacks for discordForm");

    if (! message.channel.permissionsFor(message.guild.me).has('ADD_REACTIONS'))
        throw Error("Missing ADD_REACTIONS privilege");

    /** @type {string[]} */
    let formButtons = buttons.slice();

    /** @type {TCallbackMap} */
    let formCallbacks = callbacks instanceof Map
        ? new Map(callbacks)
        : new Map(Object.entries(callbacks));

    const formMessage = message;

    const formCollector = formMessage.createReactionCollector(
        filter = (react, user) => user != formMessage.guild.me.user,
        options = {}
    );

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
     * @returns {Promise<number>}
     */
    async function interface_swap(button_a, button_b) {
        if (! formCallbacks.has(button_a) ||
            ! formCallbacks.has(button_b))
            return -1;

        const indexA = formButtons.findIndex(v => v == button_a);

        await reactPromise;

        for (let i = indexA; i < formButtons.length; ++i)
            await formMessage.reactions.resolve(formButtons[i]).remove();

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
        await formMessage.reactions.removeAll();
    }

    /**
     * Resets the buttons, removes all reactions not from the bot.
     * @returns {Promise<void>}
     */
    async function interface_reset() {
        await reactPromise;

        for (const button of formButtons) {
            const resolved = formMessage.reactions.resolve(button);

            if (resolved) {
                const users = await resolved.users.fetch();

                for (const user of users) {
                    if (user[1] != formMessage.guild.me.user) {
                        await resolved.users.remove(user[1]);
                    }
                }
            }
        }
    }

    /**
     * Sets the callback for `button`
     * @param {string} button 
     * @param {function(User, IForm)} callback 
     */
    function interface_set_callback(button, callback) {
        formCallbacks.set(button, callback);
    }

    /**
     * Adds a new button at index.
     * If index is -1, the button gets pushed at the end of the list.
     * If a button is already present, returns -1.
     * @param {string} button 
     * @param {number} index 
     * @returns {Promise<number>}
     */
    async function interface_add_button(button, index = -1) {
        if (! formCallbacks.has(button))
            return -1;

        if (index == -1)
            index = formButtons.length;

        await reactPromise;
        for (let i = index; i < formButtons.length; ++i)
            await formMessage.reactions.resolve(formButtons[i]).remove();

        formButtons.splice(index, 0, button);

        reactPromise = add_reacts(index);
        return 0;
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
        for (let i = buttonIndex; i < formButtons.length; ++i)
            await formMessage.reactions.resolve(formButtons[i]).remove();

        formButtons.splice(buttonIndex, 1);

        reactPromise = add_reacts(buttonIndex);
        return 0;
    }

    /**
     * Overrides the buttons, deletes and resends reactions
     * Returns `n` if buttons[n] doesn't have a callback registered.
     * Returns -1 otherwise.
     * @param {string[]} new_buttons 
     * @returns {Promise<number>}
     */
    async function interface_set_buttons(new_buttons) {
        for (let i = 0; i < new_buttons.length; ++i)
            if (! formCallbacks.has(new_buttons[i]))
                return i;

        let sameUntil = 0;

        for (sameUntil = 0; sameUntil < Math.min(new_buttons.length, formButtons.length); ++sameUntil)
            if (formButtons[sameUntil] != new_buttons[sameUntil])
                break;

        await reactPromise;

        if (sameUntil == 0)
            await formMessage.reactions.removeAll();
        else
            for (let i = sameUntil; i < formButtons.length; ++i)
                await formMessage.reactions.resolve(formButtons[i]).remove();

        formButtons = new_buttons.slice();

        reactPromise = add_reacts(sameUntil);

        return -1;
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
        setCallback: interface_set_callback,
        addButton: interface_add_button,
        removeButton: interface_remove_button,
        setButtons: interface_set_buttons,
        waitReactions: () => reactPromise
    };

    formCollector.on('collect', async (react, user) => {
        if (formButtons.some(v => v == react.emoji.name)) {
            await formCallbacks.get(react.emoji.name)(user, formInterface);
        }
        else {
            // Remove unspecified reactions
            await react.users.remove(user);
        }
    });

    reactPromise = add_reacts(0);

    return formInterface;
};

const createFormMessage = async (channel, {content, extra_content}, buttons, callbacks) => {
    if (! channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES'))
        throw Exception("Missing SEND_MESSAGES privilege");

    const message = await channel.send(content, extra_content);

    return createForm(message, buttons, callbacks);
}

module.exports = {
    createForm,
    createFormMessage
};