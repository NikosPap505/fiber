const TelegramBot = require('node-telegram-bot-api');
const userService = require('./userService');
const reportService = require('./reportService');
const sheetService = require('./sheetService');
const formStateService = require('./formStateService');
const phyllo1Service = require('./phyllo1Service');

class BotService {
    constructor() {
        this.bot = null;
        // Simple in-memory state management for conversation flows
        // Structure: { chatId: { step: 'WAITING_FOR_SITE', data: {...} } }
        this.userState = {};
    }

    init() {
        if (this.bot) return;

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            console.error('TELEGRAM_BOT_TOKEN is missing');
            return;
        }

        this.bot = new TelegramBot(token, { polling: true });
        console.log('Telegram Bot started...');

        this.setupListeners();
    }

    setupListeners() {
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramUserId = msg.from.id.toString();
            const name = `${msg.from.first_name} ${msg.from.last_name || ''} `.trim();

            // Check or create user
            const user = await userService.createUser({
                user_id: `U - ${telegramUserId} `,
                name: name,
                telegram_chat_id: telegramUserId
            });

            this.bot.sendMessage(chatId, `Welcome ${name} !You are registered as ${user.role}.Type / today to see your tasks.`);
        });

        this.bot.onText(/\/today/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramUserId = msg.from.id.toString();

            // Get internal user ID
            const user = await userService.getUserByTelegramId(telegramUserId);
            if (!user) {
                this.bot.sendMessage(chatId, 'Please run /start first.');
                return;
            }

            const sites = await userService.getDailyProgram(user.user_id);

            if (sites.length === 0) {
                this.bot.sendMessage(chatId, 'No pending tasks for today! 🎉');
                return;
            }

            // Create keyboard with sites
            const keyboard = {
                inline_keyboard: sites.map(site => [{
                    text: `${site.site_id} - ${site.address} (${site.type})`,
                    callback_data: `SELECT_SITE:${site.site_id} `
                }])
            };

            this.bot.sendMessage(chatId, '📅 Here are your tasks for today:', { reply_markup: keyboard });
        });

        // /resume command to continue incomplete forms
        this.bot.onText(/\/resume/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramUserId = msg.from.id.toString();

            const savedState = await formStateService.loadFormState(chatId.toString());
            if (!savedState) {
                this.bot.sendMessage(chatId, 'No incomplete form found. Use /today to start a new task.');
                return;
            }

            // Restore state
            this.userState[chatId] = savedState;
            this.bot.sendMessage(chatId, `Resuming form for site ${savedState.siteId}...`);

            // Re-ask the current question
            this.askCurrentQuestion(chatId, savedState.step);
        });

        // /skip command to skip photo or comments
        this.bot.onText(/\/skip/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramUserId = msg.from.id.toString();
            const state = this.userState[chatId];

            if (!state || !state.step) {
                this.bot.sendMessage(chatId, 'No active form. Use /today to start a task.');
                return;
            }

            const user = await userService.getUserByTelegramId(telegramUserId);

            // Skip photo - go to comments
            if (state.step.startsWith('ASK_PHOTO')) {
                this.bot.sendMessage(chatId, 'Photo skipped. Any comments? (Type your comments or send /skip to skip)');
                state.step = state.step.replace('ASK_PHOTO', 'ASK_COMMENTS');
            }
            // Skip comments - submit report
            else if (state.step.startsWith('ASK_COMMENTS')) {
                this.bot.sendMessage(chatId, 'Comments skipped. Submitting report...');
                await this.submitReport(chatId, state, user);
            }
        });

        // Handle callback queries (button clicks)
        this.bot.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;
            const telegramUserId = query.from.id.toString();

            if (data.startsWith('SELECT_APPOINTMENT:')) {
                const srId = data.split(':')[1];
                const user = await userService.getUserByTelegramId(telegramUserId);

                // Start form flow based on user role
                this.userState[chatId] = {
                    step: 'FORM_START',
                    siteId: srId, // Using SR ID as site ID
                    role: user.role,
                    formData: {}
                };

                if (user.role === 'WORKER_AUTOPSY') {
                    this.bot.sendMessage(chatId, 'Αυτοψία - Παρακαλώ δώστε τη ΔΙΕΥΘΥΝΣΗ:');
                    this.userState[chatId].step = 'ASK_ΔΙΕΥΘΥΝΣΗ';
                } else if (user.role === 'WORKER_CONSTRUCTION') {
                    this.askQuestion(chatId, 'Is BCP installed? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_BCP';
                } else if (user.role === 'WORKER_OPTICAL') {
                    this.askQuestion(chatId, 'Is Splicing done? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_SPLICING';
                } else if (user.role === 'WORKER_DIGGING') {
                    this.askQuestion(chatId, 'Is trench dug? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_TRENCH';
                } else {
                    this.bot.sendMessage(chatId, 'You do not have a worker role assigned.');
                }
            } else if (data.startsWith('SELECT_SITE:')) {
                const siteId = data.split(':')[1];
                const user = await userService.getUserByTelegramId(telegramUserId);

                // Start form flow based on user role or site type
                // For simplicity, we assume role dictates form
                this.userState[chatId] = {
                    step: 'FORM_START',
                    siteId: siteId,
                    role: user.role,
                    formData: {}
                };

                if (user.role === 'WORKER_AUTOPSY') {
                    this.bot.sendMessage(chatId, 'Αυτοψία - Παρακαλώ δώστε τη ΔΙΕΥΘΥΝΣΗ:');
                    this.userState[chatId].step = 'ASK_ΔΙΕΥΘΥΝΣΗ';
                } else if (user.role === 'WORKER_CONSTRUCTION') {
                    this.askQuestion(chatId, 'Is BCP installed? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_BCP';
                } else if (user.role === 'WORKER_OPTICAL') {
                    this.askQuestion(chatId, 'Is Splicing done? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_SPLICING';
                } else if (user.role === 'WORKER_DIGGING') {
                    this.askQuestion(chatId, 'Is trench dug? (YES/NO)', ['YES', 'NO']);
                    this.userState[chatId].step = 'ASK_TRENCH';
                } else {
                    this.bot.sendMessage(chatId, 'You do not have a worker role assigned.');
                }
            } else if (data.startsWith('ANSWER:')) {
                this.handleAnswer(chatId, data.split(':')[1], telegramUserId);
            }
        });

        // Handle photo messages
        this.bot.on('photo', async (msg) => {
            const chatId = msg.chat.id;
            const state = this.userState[chatId];

            if (!state || !state.step || !state.step.startsWith('ASK_PHOTO')) {
                this.bot.sendMessage(chatId, 'Please start a report first using /today');
                return;
            }

            // Get the highest resolution photo
            const photo = msg.photo[msg.photo.length - 1];
            state.formData.photo_url = photo.file_id;
            console.log('📷 Photo received! file_id:', photo.file_id);
            console.log('📷 Current formData:', state.formData);
            await formStateService.saveFormState(chatId.toString(), state);

            // Ask for comments
            this.bot.sendMessage(chatId, 'Photo received! ✅\n\nAny comments? (Type your comments or send /skip to skip)');
            state.step = state.step.replace('ASK_PHOTO', 'ASK_COMMENTS');
        });

        // Handle text messages (for dates, AUTOPSY fields, and comments)
        this.bot.on('message', async (msg) => {
            if (msg.photo || msg.text?.startsWith('/')) return; // Ignore photos and commands

            const chatId = msg.chat.id;
            const text = msg.text;

            // Check if message is a date in DD/MM/YYYY format
            const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const dateMatch = text.match(datePattern);

            if (dateMatch) {
                // User typed a date - show appointments
                const telegramUserId = msg.from.id.toString();
                const user = await userService.getUserByTelegramId(telegramUserId);

                if (!user) {
                    this.bot.sendMessage(chatId, 'User not found. Please contact admin.');
                    return;
                }

                try {
                    const appointments = await phyllo1Service.getAppointmentsByDate(text, user.role);

                    if (appointments.length === 0) {
                        this.bot.sendMessage(chatId, `No appointments found for ${text}`);
                        return;
                    }

                    // Display appointments as inline buttons
                    const buttons = appointments.map(apt => [{
                        text: `${apt.address} - ${apt.appointment_time || 'No time'}`,
                        callback_data: `SELECT_APPOINTMENT:${apt.sr_id}`
                    }]);

                    this.bot.sendMessage(chatId, `📅 Appointments for ${text}:`, {
                        reply_markup: { inline_keyboard: buttons }
                    });
                } catch (error) {
                    console.error('Error fetching appointments:', error);
                    this.bot.sendMessage(chatId, 'Error fetching appointments. Please try again.');
                }
                return;
            }

            // Continue with existing text handler logic
            const state = this.userState[chatId];

            if (!state || !state.step) return;

            const telegramUserId = msg.from.id.toString();
            const user = await userService.getUserByTelegramId(telegramUserId);

            // AUTOPSY FLOW - Text inputs for Greek fields
            if (state.step === 'ASK_ΔΙΕΥΘΥΝΣΗ') {
                state.formData.ΔΙΕΥΘΥΝΣΗ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'Όνομα ΠΕΛΑΤΗ:');
                state.step = 'ASK_ΠΕΛΑΤΗ';
            } else if (state.step === 'ASK_ΠΕΛΑΤΗ') {
                state.formData.ΠΕΛΑΤΗ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'ΤΗΛ. ΕΠΙΚΟΙΝΩΝΙΑΣ ΠΕΛΑΤΗ:');
                state.step = 'ASK_ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ';
            } else if (state.step === 'ASK_ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ') {
                state.formData.ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'ΣΤΟΙΧΕΙΑ ΔΙΑΧΕΙΡΙΣΤΗ:');
                state.step = 'ASK_ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ';
            } else if (state.step === 'ASK_ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ') {
                state.formData.ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ (π.χ. 2025-01-20):');
                state.step = 'ASK_ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ';
            } else if (state.step === 'ASK_ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ') {
                state.formData.ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'ΩΡΑ ΡΑΝΤΕΒΟΥ (π.χ. 14:00):');
                state.step = 'ASK_ΩΡΑ_ΡΑΝΤΕΒΟΥ';
            } else if (state.step === 'ASK_ΩΡΑ_ΡΑΝΤΕΒΟΥ') {
                state.formData.ΩΡΑ_ΡΑΝΤΕΒΟΥ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                this.bot.sendMessage(chatId, 'ΠΕΡΙΟΧΗ:');
                state.step = 'ASK_ΠΕΡΙΟΧΗ';
            } else if (state.step === 'ASK_ΠΕΡΙΟΧΗ') {
                state.formData.ΠΕΡΙΟΧΗ = msg.text;
                await formStateService.saveFormState(chatId.toString(), state);
                // Ask for photo
                this.bot.sendMessage(chatId, 'Please send a photo (or send /skip to skip)');
                state.step = 'ASK_PHOTO_AUTOPSY';
            }
            // COMMENTS FLOW
            else if (state.step.startsWith('ASK_COMMENTS')) {
                state.formData.comments = msg.text;
                console.log('💬 Comments received:', msg.text);
                console.log('💬 FormData before submit:', state.formData);

                // Submit the report
                await this.submitReport(chatId, state, user);
            }
        });
    }

    askQuestion(chatId, text, options = []) {
        const opts = options.length > 0 ? {
            reply_markup: {
                inline_keyboard: [options.map(opt => ({ text: opt, callback_data: `ANSWER:${opt} ` }))]
            }
        } : {};
        this.bot.sendMessage(chatId, text, opts);
    }

    async handleAnswer(chatId, answer, telegramUserId) {
        const state = this.userState[chatId];
        if (!state) return;

        const user = await userService.getUserByTelegramId(telegramUserId);

        // CONSTRUCTION FLOW
        if (state.step === 'ASK_BCP') {
            state.formData.bcp_installed = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.askQuestion(chatId, 'Is BEP installed? (YES/NO)', ['YES', 'NO']);
            state.step = 'ASK_BEP';
        } else if (state.step === 'ASK_BEP') {
            state.formData.bep_installed = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.askQuestion(chatId, 'Is BMO installed? (YES/NO)', ['YES', 'NO']);
            state.step = 'ASK_BMO';
        } else if (state.step === 'ASK_BMO') {
            state.formData.bmo_installed = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            // Ask for photo
            this.bot.sendMessage(chatId, 'Please send a photo of the installation (or send /skip to skip)');
            state.step = 'ASK_PHOTO_CONSTRUCTION';
        }

        // DIGGING FLOW
        else if (state.step === 'ASK_TRENCH') {
            state.formData.trench_dug = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.askQuestion(chatId, 'Is cable laid? (YES/NO)', ['YES', 'NO']);
            state.step = 'ASK_CABLE';
        } else if (state.step === 'ASK_CABLE') {
            state.formData.cable_laid = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.askQuestion(chatId, 'Is backfill done? (YES/NO)', ['YES', 'NO']);
            state.step = 'ASK_BACKFILL';
        } else if (state.step === 'ASK_BACKFILL') {
            state.formData.backfill_done = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'CAB:');
            state.step = 'ASK_CAB_DIGGING';
        } else if (state.step === 'ASK_CAB_DIGGING') {
            state.formData.CAB = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'ΑΝΑΜΟΝΗ:');
            state.step = 'ASK_ΑΝΑΜΟΝΗ_DIGGING';
        } else if (state.step === 'ASK_ΑΝΑΜΟΝΗ_DIGGING') {
            state.formData.ΑΝΑΜΟΝΗ = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'ΓΡΑΜΜΟΓΡΑΦΗΣΗ:');
            state.step = 'ASK_ΓΡΑΜΜΟΓΡΑΦΗΣΗ_DIGGING';
        } else if (state.step === 'ASK_ΓΡΑΜΜΟΓΡΑΦΗΣΗ_DIGGING') {
            state.formData.ΓΡΑΜΜΟΓΡΑΦΗΣΗ = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            // Ask for photo
            this.bot.sendMessage(chatId, 'Please send a photo of the work (or send /skip to skip)');
            state.step = 'ASK_PHOTO_DIGGING';
        }

        // OPTICAL FLOW
        else if (state.step === 'ASK_SPLICING') {
            state.formData.splicing_done = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'Measurements (e.g., -15dB):');
            state.step = 'ASK_MEASUREMENTS';
        } else if (state.step === 'ASK_MEASUREMENTS') {
            state.formData.measurements = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'CAB:');
            state.step = 'ASK_CAB_OPTICAL';
        } else if (state.step === 'ASK_CAB_OPTICAL') {
            state.formData.CAB = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'ΑΝΑΜΟΝΗ:');
            state.step = 'ASK_ΑΝΑΜΟΝΗ_OPTICAL';
        } else if (state.step === 'ASK_ΑΝΑΜΟΝΗ_OPTICAL') {
            state.formData.ΑΝΑΜΟΝΗ = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            this.bot.sendMessage(chatId, 'ΓΡΑΜΜΟΓΡΑΦΗΣΗ:');
            state.step = 'ASK_ΓΡΑΜΜΟΓΡΑΦΗΣΗ_OPTICAL';
        } else if (state.step === 'ASK_ΓΡΑΜΜΟΓΡΑΦΗΣΗ_OPTICAL') {
            state.formData.ΓΡΑΜΜΟΓΡΑΦΗΣΗ = answer;
            await formStateService.saveFormState(chatId.toString(), state);
            // Ask for photo
            this.bot.sendMessage(chatId, 'Please send a photo of the splicing (or send /skip to skip)');
            state.step = 'ASK_PHOTO_OPTICAL';
        }
    }

    askCurrentQuestion(chatId, step) {
        // Re-ask question based on current step
        if (step === 'ASK_BCP') {
            this.askQuestion(chatId, 'Is BCP installed? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_BEP') {
            this.askQuestion(chatId, 'Is BEP installed? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_BMO') {
            this.askQuestion(chatId, 'Is BMO installed? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_TRENCH') {
            this.askQuestion(chatId, 'Is trench dug? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_CABLE') {
            this.askQuestion(chatId, 'Is cable laid? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_BACKFILL') {
            this.askQuestion(chatId, 'Is backfill done? (YES/NO)', ['YES', 'NO']);
        } else if (step === 'ASK_SPLICING') {
            this.askQuestion(chatId, 'Is Splicing done? (YES/NO)', ['YES', 'NO']);
        } else if (step.startsWith('ASK_PHOTO')) {
            this.bot.sendMessage(chatId, 'Please send a photo (or send /skip to skip)');
        } else if (step.startsWith('ASK_COMMENTS')) {
            this.bot.sendMessage(chatId, 'Any comments? (Type your comments or send /skip to skip)');
        }
    }

    async submitReport(chatId, state, user) {
        try {
            if (state.role === 'WORKER_AUTOPSY') {
                await reportService.submitAutopsyReport({
                    site_id: state.siteId,
                    user_id: user.user_id,
                    ...state.formData
                });
                this.bot.sendMessage(chatId, '✅ Autopsy report submitted successfully!');
            } else if (state.role === 'WORKER_CONSTRUCTION') {
                const reportData = {
                    site_id: state.siteId,
                    user_id: user.user_id,
                    ...state.formData
                };
                console.log('📝 Submitting construction report:', reportData);
                await reportService.submitConstructionReport(reportData);
                this.bot.sendMessage(chatId, '✅ Construction report submitted successfully!');
            } else if (state.role === 'WORKER_DIGGING') {
                await reportService.submitDiggingReport({
                    site_id: state.siteId,
                    user_id: user.user_id,
                    ...state.formData
                });
                this.bot.sendMessage(chatId, '✅ Digging report submitted successfully!');
            } else if (state.role === 'WORKER_OPTICAL') {
                await reportService.submitOpticalReport({
                    site_id: state.siteId,
                    user_id: user.user_id,
                    ...state.formData
                });
                this.bot.sendMessage(chatId, '✅ Optical report submitted successfully!');
            }

            await formStateService.clearFormState(chatId.toString());
            delete this.userState[chatId];
        } catch (error) {
            console.error('Error submitting report:', error);
            this.bot.sendMessage(chatId, '❌ Error submitting report. Please try again.');
        }
    }
}

module.exports = new BotService();
