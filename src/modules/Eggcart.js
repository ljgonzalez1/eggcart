const path = require('path');
const { Telegraf, Markup } = require('telegraf')

const config = require(path.join(__dirname, '..', 'config'));
const EggoListController = require(path.join(__dirname, '..', 'controllers', 'eggolist.js'));
const ChatListController = require(path.join(__dirname, '..', 'controllers', 'chatlist.js'));

/**
 * Escapes Markdown V2 characters in a given text.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
function escapeMarkdownV2Characters(text) {
    return text.replace(/([_()*~`>#+-=|{}[\].!\\])/g, '\\$1');
}

/**
 * Beautifies the input text by trimming whitespace, removing trailing periods,
 * and capitalizing the first character.
 *
 * @param {string} text - The text to be beautified.
 * @returns {string} The beautified text.
 */
function beautifyText(text) {
    let trimmedText = text.trim();
    
    if (trimmedText.endsWith('.')) {
        trimmedText = trimmedText.slice(0, -1);
    }
    
    trimmedText = trimmedText.trim();
    
    if (trimmedText.endsWith('.')) {
        trimmedText = trimmedText.slice(0, -1);
    }
    
    return trimmedText.replace(/^\w/, c => c.toUpperCase());
}

/**
 * Generates an inline keyboard for Telegram chats with pagination if necessary.
 * The keyboard displays items and includes buttons for deletion and navigation.
 *
 * @param {Array} items - The array of items to be displayed as buttons.
 * @param {number} chatId - The chat ID to which the buttons will send callbacks.
 * @param {number} [currentPage=0] - The current page number for pagination (default is 0).
 * @returns {Markup} The inline keyboard markup for Telegram.
 */
function generateInlineKeyboard(items, chatId, currentPage = 0) {
    const itemCount = items.length;
    let columns;
    let paginated = false;
    let buttons;
    
    if (itemCount < 6) {
        columns = 1;
        
    } else {
        columns = 2;
        paginated = true;
    }
    
    const itemsPerPage = 6;
    
    if (paginated) {
        const pageStart = currentPage * itemsPerPage;
        const pageEnd = pageStart + itemsPerPage;
        items.slice(pageStart, pageEnd).map(item =>
          Markup.button.callback(item.item, `delete_item_${item.id}_${chatId}`));
        
    } else {
        items.map(item =>
          Markup.button.callback(item.item, `delete_item_${item.id}_${chatId}`));
    }
    
    buttons = items.map(item =>
      Markup.button.callback(item.item, `delete_item_${item.id}_${chatId}`));
    
    if (paginated) {
        if (currentPage > 0) {
            buttons.push(Markup.button.callback('⬅️', `prev_page_${currentPage}_${chatId}`));
        }
        
        buttons.push(Markup.button.callback('↩️', `go_back_${chatId}`));
        
        if (itemCount > currentPage * itemsPerPage) {
            buttons.push(Markup.button.callback('➡️', `next_page_${currentPage}_${chatId}`));
        }
        
    } else {
        buttons.push(Markup.button.callback('↩️', `go_back_${chatId}`));
    }
    
    return Markup.inlineKeyboard(buttons, {columns: columns});
}

class EggCart {
    constructor() {
        this.listController = new EggoListController();
        this.chatListController = new ChatListController();
        
        this.bot = new Telegraf(config.telegram.token);
        
        this.bot.telegram.getMe().then((botInfo) => {
            this.botName = botInfo.username;
        });
    }
    
    /**
     * Sets up event handlers for buttons in the Telegram bot.
     * This function defines the actions to be performed when specific
     * buttons in the bot's inline keyboard are pressed.
     */
    setupButtonHandlers() {
        this.bot.action(/^prev_page_(\d+)_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_');
            const currentPageIndex = parseInt(parts[2]);
            const chatId = parseInt(parts[3]);
            
            console.log(`prev_page_${currentPageIndex}_${chatId}`);
            
            try {
                const items = await this.listController.getItems(chatId);
                const prevPageIndex = currentPageIndex - 1;
                
                if (prevPageIndex < 0) return;
                
                const newKeyboard = generateInlineKeyboard(items, chatId, prevPageIndex);
                
                await ctx.deleteMessage();
                await ctx.reply("¿Cuál quieres eliminar?", {
                    reply_markup: newKeyboard.reply_markup
                });
                
            } catch (error) {
                console.error("Error en prev_page:", error);
                await ctx.reply("Ha ocurrido un error cargando a la página anterior.");
            }
        });
        
        this.bot.action(/^delete_item_(\d+)_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_');
            const itemId = parts[2];
            const chatId = parts[3];
            
            console.log(`delete_item_${itemId}_${chatId}`);
            
            try {
                const item = await this.listController.findItemById(itemId);
                
                if (item) {
                    await ctx.deleteMessage();
                    await this.performDeleteItem(chatId, item.item)(ctx);
                    
                } else {
                    await ctx.reply("Pendiente no encontrado.");
                }
                
            } catch (error) {
                console.error("Error en delete_item:", error);
                await ctx.reply("Ha ocurrido un error eliminando el pendiente.");
            }
        });
        
        this.bot.action(/next_page_(\d+)_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_');
            const currentPageIndex = parseInt(parts[2]);
            const chatId = parseInt(parts[3])
            const itemsPerPage = 9;
            
            console.log(`next_page_${currentPageIndex}_${chatId}`);
            
            try {
                const items = await this.listController.getItems(chatId);
                const totalPages = Math.ceil(items.length / itemsPerPage);
                const nextPageIndex = currentPageIndex + 1;
                
                if (nextPageIndex >= totalPages) return;
                
                const newKeyboard = generateInlineKeyboard(items, chatId, nextPageIndex);
                
                await ctx.deleteMessage();
                await ctx.reply("¿Cuál quieres eliminar?", {
                    reply_markup: newKeyboard.reply_markup
                });
                
            } catch (error) {
                console.error("Error en next_page:", error);
                await ctx.reply("Ha ocurrido un error cambiando a la siguiente página");
            }
        });
        
        this.bot.action(/go_back_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_')
            const chatId = parseInt(parts[2]);
            ctx.chat.id = chatId
            
            console.log(`go_back_${chatId}`)
            
            try {
                await ctx.deleteMessage();
                await this.performGetList(ctx, chatId);
                
            } catch (error) {
                console.error("Error en go_back:", error);
                await ctx.reply("Ha ocurrido un error al volver");
            }
        });
        
        this.bot.action(/check_item_(-?\d+)$/, async (ctx) => {
            const currentPage = 0;
            const parts = ctx.match[0].split('_')
            const chatId = parseInt(parts[2]);
            ctx.chat.id = chatId
            
            console.log(`check_item_${chatId}`)
            
            try {
                await ctx.deleteMessage();
                
                const chatListId = await this.chatListController.getChatList(chatId);
                const items = await this.listController.getItems(chatListId.id);
                
                const keyboard = generateInlineKeyboard(items, chatId, currentPage);
                
                await ctx.reply("¿Cuál quieres eliminar?", keyboard);
                
            } catch (error) {
                console.error("Error en check_item:", error);
                await ctx.reply("Ha ocurrido un error");
            }
        });
        
        this.bot.action(/ok_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_')
            const chatId = parseInt(parts[1]);
            ctx.chat.id = chatId
            
            console.log(`ok_${chatId}`)
            
            try {
                await ctx.editMessageReplyMarkup({
                    chat_id: ctx.chat.id,
                    message_id: ctx.update.callback_query.message.message_id,
                    reply_markup: { inline_keyboard: [] } });
                
            } catch (error) {
                console.error("Error editing message:", error);
            }
        });
        
        this.bot.action(/^clear_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_')
            const chatId = parts[1]
            
            console.log(`clear_${chatId}`)
            
            try {
                await ctx.deleteMessage();
                
            } catch (error) {
                console.error("Error deleting the message:", error);
            }
            
            try {
                const confirmButton = Markup.button.callback('✔️', `confirm_clear_${chatId}`);
                const cancelButton = Markup.button.callback('❌', `cancel_clear_${chatId}`);
                const confirmationKeyboard = Markup.inlineKeyboard([confirmButton, cancelButton]);
                
                ctx.reply("¿Estás seguro(a) de que quieres eliminar la lista completa?", confirmationKeyboard);
                
            } catch (error) {
                console.error("Error in clear command:", error);
            }
        });
        
        this.bot.action(/confirm_clear_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_');
            const chatId = parseInt(parts[2]);
            
            console.log(`confirm_clear_${chatId}`);
            
            try {
                await ctx.deleteMessage();
                await this.performClearList(ctx, chatId);
                
            } catch (error) {
                console.error("Error en confirm_clear:", error);
            }
        });
        
        this.bot.action(/cancel_clear_(-?\d+)$/, async (ctx) => {
            const parts = ctx.match[0].split('_');
            const chatId = parseInt(parts[2]);
            
            console.log(`cancel_clear_${chatId}`);
            
            try {
                await ctx.deleteMessage();
                await this.performGetList(ctx, chatId);
                
            } catch (error) {
                console.error("Error en cancel_clear:", error);
            }
        });
    }
    
    /**
     * Add an item to the shopping list via the bot command.
     */
    addItem() {
        this.bot.command('add', async (ctx) => {
            const chatId = ctx.chat.id;
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                let itemsToAdd = messageText.slice(messageText.indexOf(" ") + 1).split(",");
                let response = '¡Okay\\! \n';
                
                for (let itemText of itemsToAdd) {
                    try {
                        const chatList = await this.chatListController.findOrCreateChatList(chatId);
                        await this.listController.addItem(chatList.id, beautifyText(itemText.trim()));
                        
                        response += `*${escapeMarkdownV2Characters(beautifyText(itemText.trim()))}*, `;
                        
                    } catch (error) {
                        console.error(error);
                    }
                }
                
                response = response.slice(0, -2) + ' ahora está\\(n\\) en la lista de pendientes\\.';
                ctx.replyWithMarkdownV2(response);
            }
        });
    }
    
    agregar() {
        this.bot.command('agregar', async (ctx) => {
            const chatId = ctx.chat.id;
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                let itemsToAdd = messageText.slice(messageText.indexOf(" ") + 1).split(",");
                let response = '¡Okay\\! \n';
                
                for (let itemText of itemsToAdd) {
                    try {
                        const chatList = await this.chatListController.findOrCreateChatList(chatId);
                        await this.listController.addItem(chatList.id, beautifyText(itemText.trim()));
                        
                        response += `*${escapeMarkdownV2Characters(beautifyText(itemText.trim()))}*, `;
                        
                    } catch (error) {
                        console.error(error);
                    }
                }
                
                response = response.slice(0, -2) + ' ahora está\\(n\\) en la lista de pendientes\\.';
                ctx.replyWithMarkdownV2(response);
            }
        });
    }
    
    /**
     * Remove an item from the shopping list via the bot command.
     */
    deleteItem() {
        this.bot.command('remove', async (ctx) => {
            const chatId = ctx.chat.id;
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                let itemsToRemove = messageText.slice(messageText.indexOf(" ") + 1).split(",");
                
                for (let itemName of itemsToRemove) {
                    await this.performDeleteItem(chatId, itemName.trim())(ctx);
                }
            }
        });
    }
    
    quitar() {
        this.bot.command('quitar', async (ctx) => {
            const chatId = ctx.chat.id;
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                let itemsToRemove = messageText.slice(messageText.indexOf(" ") + 1).split(",");
                
                for (let itemName of itemsToRemove) {
                    await this.performDeleteItem(chatId, itemName.trim())(ctx);
                }
            }
        });
    }
    
    /**
     * Creates a function to delete a specified item from the shopping list.
     * This method handles finding and removing the item, as well as sending the appropriate response.
     *
     * @param {number} chatId - The chat ID in which the item will be deleted.
     * @param {string} itemName - The name of the item to be deleted.
     * @returns {Function} A function that takes a Telegram context (ctx) and performs the delete operation.
     */
    performDeleteItem(chatId, itemName) {
        itemName = beautifyText(itemName);
        
        return async (ctx) => {
            let response;
            
            try {
                const chatList = await this.chatListController.getChatList(chatId);
                
                if (chatList) {
                    const item = await this.listController.findItemByName(chatList.id, itemName);
                    
                    if (item) {
                        await this.listController.removeItem(item.id);
                        response = `¡Okey\\! \n*${escapeMarkdownV2Characters(itemName)}* Se ha eliminado de la lista de pendientes\\.`;
                        
                    } else {
                        response = `¡Oh\\! \n*${escapeMarkdownV2Characters(itemName)}* El pendiente no se ha encontrado en la lista\\.`;
                    }
                    
                } else {
                    response = `¡Oh\\! \nNo se ha encontrado una lista de pendientes en este chat\\.`;
                }
                
            } catch (error) {
                console.error(error);
                response = `¡Oh\\! \nError al eliminar *${escapeMarkdownV2Characters(itemName)}* de la lista de pendientes\\.`;
            }
            
            ctx.replyWithMarkdownV2(response);
        };
    }
    
    /**
     * Retrieve the shopping list via the bot command.
     */
    getList() {
        this.bot.command('list', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                await this.performGetList(ctx, ctx.chat.id);
            }
        });
    }
    
    lista() {
        this.bot.command('lista', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                await this.performGetList(ctx, ctx.chat.id);
            }
        });
    }
    
    /**
     * Retrieves and displays the shopping list for a specific chat.
     * This method fetches the list associated with the given chat ID and formats the response,
     * including an inline keyboard for interaction.
     *
     * @param {Object} ctx - The Telegram context object.
     * @param {number} chatId - The ID of the chat for which the shopping list is to be retrieved.
     */
    async performGetList(ctx, chatId) {
        
        console.log(chatId);
        try {
            const chatList = await this.chatListController.getChatList(chatId);
            
            let response;
            let keyboard = Markup.inlineKeyboard([]);
            
            if (chatList) {
                console.log("chatList.id:", chatList.id);
                
                let items = await this.listController.getItems(chatList.id);
                
                response = '*Lista de pendientes*\n';
                
                if (items.length === 0) {
                    response += "No hay nada en la lista\\. \nIntenta añadir *Sacar la basura*\\.";
                    
                } else {
                    items.forEach((item, index) => {
                        response += `${index + 1}\\. ${escapeMarkdownV2Characters(item.item)}\n`;
                    });
                    
                    keyboard = Markup.inlineKeyboard([
                        Markup.button.callback('✏️', `check_item_${chatId}`),
                        Markup.button.callback('✔️', `ok_${chatId}`),
                        Markup.button.callback('🔥', `clear_${chatId}`)
                    ]);
                }
                
            } else {
                response = "No se encontró una lista de pendientes en este chat\\. \nComienza por agregar pendientes\\.";
            }
            
            ctx.replyWithMarkdownV2(response, keyboard);
            
        } catch (error) {
            console.error('Error performing get list:', error);
            ctx.replyWithMarkdownV2("Ha ocurrido un error obteniendo la lista de pendientes\\.");
        }
    }
    
    /**
     * Clear the shopping list via the bot command.
     */
    clearList() {
        this.bot.command('clear', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                await this.performClearList(ctx, ctx.chat.id);
            }
        });
        
        this.setupButtonHandlers();
    }
    
    limpiar() {
        this.bot.command('limpiar', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                await this.performClearList(ctx, ctx.chat.id);
            }
        });
        
        this.setupButtonHandlers();
    }
    
    /**
     * Clears the shopping list for a specific chat.
     * This method handles the removal of all items from the list associated with the given chat ID.
     *
     * @param {Object} ctx - The Telegram context object.
     * @param {number} chatId - The ID of the chat for which the shopping list is to be cleared.
     */
    async performClearList(ctx, chatId) {
        try {
            const chatList = await this.chatListController.getChatList(chatId);
            
            if (chatList) {
                await this.listController.clearItems(chatList.id);
                ctx.replyWithMarkdownV2("La lista de pendientes ha sido borrada\\.");
                
            } else {
                ctx.replyWithMarkdownV2("No hay lista de pendientes en este chat\\.");
            }
            
        } catch (error) {
            console.error(error);
            ctx.replyWithMarkdownV2("Ha ocurrido un error borrando la lista de pendientes.\\.");
        }
    }
    
    /**
     * Removes all items from a shopping list.
     * This method deletes all items associated with a specific chatListId.
     *
     * @param {number} chatListId - The ID of the chat list from which items are to be cleared.
     */
    async clearItems(chatListId) {
        try {
            await EggoListModel.destroy({ where: { chatListId } });
            
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
    /**
     * Starts the Telegram bot and sets up the 'start' command.
     * When the 'start' command is issued, the bot replies with a welcome message and usage instructions.
     */
    start() {
        this.bot.command('start', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                ctx.reply(
                  `Agregar un pendiente: /agregar@${this.botName} Pendinte 1, mi pendiente 2, un tercer pendiente\n` +
                  `Eliminar un pendiente: /quitar@${this.botName} mi pendiente 2\n` +
                  `Mostrar la lista: /lista@${this.botName}\n` +
                  `Limpiar la lista: /limpiar@${this.botName}\n` +
                  `Este menú: /ayuda@${this.botName}`
                );
            }
        });
    }
    
    ayuda() {
        this.bot.command('ayuda', async (ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                ctx.reply(
                  `Agregar un pendiente: /agregar@${this.botName} Pendinte 1, mi pendiente 2, un tercer pendiente\n` +
                  `Eliminar un pendiente: /quitar@${this.botName} mi pendiente 2\n` +
                  `Mostrar la lista: /lista@${this.botName}\n` +
                  `Limpiar la lista: /limpiar@${this.botName}\n` +
                  `Este menú: /ayuda@${this.botName}`
                );
            }
        });
    }
    
    /**
     * Provide help information via the bot command.
     */
    help() {
        this.bot.help((ctx) => {
            const messageText = ctx.update.message.text;
            const chatType = ctx.update.message.chat.type;
            
            if (messageText.includes(`@${this.botName}`) || chatType === 'private' || chatType === 'group' || chatType === 'supergroup') {
                ctx.reply(
                  `Agregar un pendiente: /agregar@${this.botName} Pendinte 1, mi pendiente 2, un tercer pendiente\n` +
                  `Eliminar un pendiente: /quitar@${this.botName} mi pendiente 2\n` +
                  `Mostrar la lista: /lista@${this.botName}\n` +
                  `Limpiar la lista: /limpiar@${this.botName}\n` +
                  `Este menú: /ayuda@${this.botName}`
                );
            }
        });
    }
    
    /**
     * Launch the Telegram bot.
     */
    connect() {
        this.bot.launch().then(() => {
            console.log('Bot launched successfully');
            
        }).catch(error => {
            console.error('Error launching bot:', error);
        });
    }
}

module.exports = EggCart;
