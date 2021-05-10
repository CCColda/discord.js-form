import { User, Message, MessageOptions, MessageTarget } from "discord.js";

type TCallback = (user: User, form: IForm) => any;
type TCallbackMap = Map<string, TCallback>;
type TCallbackDictionary = { [_: string]: TCallback };
type TCallbackMapLike = TCallbackMap | TCallbackDictionary | undefined;

/** Arguments for discord.js/TextChannel.send */
interface TMessageContent {
    content: string | MessageOptions;
    extra_content?: MessageOptions;
}

/** Interface for manipulating a form */
interface IForm {
    /** Message the form was called on */
    message: Message;

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

    /**
     * Transfer the whole interface to another message.
     * @throws If the client does not have permissions to add reactions in the channel of the new message.
     */
    transfer(new_message: Message): Promise<void>;

    /** Sets the callback for `button`. */
    setCallback(button: string, callback: TCallback): void;

    /**
     * Adds a new button at index.
     * If index is -1, the button gets pushed at the end of the list.
     */
    addButton(button: string, index: number): Promise<void>;

    /** Returns an existing button. If `button` doesn't exist, returns -1. */
    removeButton(button: string): Promise<number>;

    /** Overrides the buttons, deletes and resends reactions. */
    setButtons(new_buttons: string[]): Promise<void>;

    /** Waits until all reactions are added. */
    waitReactions(): Promise<void>;

    /**
     * Returns a map of all the reactions (excluding the client)
     * from the cache. The format is the same as fetchReactions'.
     */
    getReactions(): Map<string, User[]>;

    /**
     * Fetches a map of all the reactions (excluding the client).
     * This might take more time than just caching with getReactions.
     */
    fetchReactions(): Promise<Map<string, User[]>>;
}

/**
 * Creates a form on `message`.
 * @throws If message, or buttons is empty, or if the user
 *         doesn't have ADD_REACTIONS privileges in the channel of `message`.
 */
export function createForm(message: Message, buttons: string[], callbacks: TCallbackMapLike): IForm;

/**
 * Creates a form on a new message.
 * @throws If message, or buttons is empty, or if the user
 *         doesn't have ADD_REACTIONS or SEND_MESSAGES privileges in the channel.
 */
export function createFormMessage(
    channel: MessageTarget,
    content: TMessageContent | string,
    buttons: string[],
    callbacks: TCallbackMapLike
): IForm;