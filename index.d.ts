type TCallback = (user: Object, form: IForm) => void;
type TCallbackMap = Map<string, TCallback>;

/** Arguments for discord.js/TextChannel.send */
interface TMessageContent {
    content: string | Object;
    extra_content: Object?;
}

/** Interface for manipulating a form */
interface IForm {
    /** Message the form was called on */
    message: Object;

    /** Active buttons on the form */
    buttons: readonly string[];

    /** Registered button callbacks */
    callbacks: TCallbackMap;

    /**
     * Swaps button_a with button_b, updates reactions accordingly.
     * Returns -1 if formCallbacks doesn't contain either of the buttons.
     */
    swap(button_a: string, button_b: string): Promise<number>;
    
    /** Stops the reaction collector. */
    stop(): void;

    /** Clears all reactions. */
    clear(): Promise<void>;

    /** Resets the buttons, removes all reactions not from the bot. */
    reset(): Promise<void>;

    /** Sets the callback for `button`. */
    setCallback(button: string, callback: TCallback): void;

    /**
     * Adds a new button at index.
     * If index is -1, the button gets pushed at the end of the list.
     * If a button is already present, returns -1.
     */
    addButton(button: string, index: number): Promise<number>;

    /** Returns an existing button. If `button` doesn't exist, returns -1. */
    removeButton(button: string): Promise<number>;

    /**
     * Overrides the buttons, deletes and resends reactions
     * Returns `n` if buttons[n] doesn't have a callback registered.
     * Returns -1 otherwise.
     */
    setButtons(new_buttons: string[]): Promise<number>;

    /** Waits until all reactions are added. */
    waitReactions(): Promise<void>;
}

/**
 * Creates a form on `message`.
 * `buttons` must contain strings which can be found in `callbacks` too.
 * @throws If message, buttons, or callbacks is empty, or if the user
 *         doesn't have ADD_REACTIONS privileges in the channel of `message`.
 */
export function createForm(message: Object, buttons: string[], callbacks: TCallbackMap | Object): IForm;

/**
 * Creates a form on a new message.
 * `buttons` must contain strings which can be found in `callbacks` too.
 * @throws If message, buttons, or callbacks is empty, or if the user
 *         doesn't have ADD_REACTIONS or SEND_MESSAGES privileges in the channel.
 */
export function createFormMessage(
    channel: Object,
    content: TMessageContent,
    buttons: string[],
    callbacks: TCallbackMap | Object
): IForm;