require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const userCraft = {};

client.once(Events.ClientReady, () => {
    console.log(`Bot online: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    // /painel
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'painel') {

            const embed = new EmbedBuilder()
                .setTitle('🔫 ARMARIA OESTE RP')
                .setDescription('Sistema profissional de registro de craft.')
                .setColor('DarkRed');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('craft')
                        .setLabel('Registrar Craft')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // BOTÃO
    if (interaction.isButton()) {

        if (interaction.customId === 'craft') {

            const menu = new StringSelectMenuBuilder()
                .setCustomId('arma_select')
                .setPlaceholder('Selecione a arma')
                .addOptions([
                    {
                        label: 'Revolver Cattleman',
                        value: 'Revolver Cattleman'
                    },
                    {
                        label: 'Rifle Lancaster',
                        value: 'Rifle Lancaster'
                    },
                    {
                        label: 'Escopeta Cano Duplo',
                        value: 'Escopeta Cano Duplo'
                    },
                    {
                        label: 'Munição Revolver',
                        value: 'Munição Revolver'
                    },
                    {
                        label: 'Munição Rifle',
                        value: 'Munição Rifle'
                    }
                ]);

            const row = new ActionRowBuilder()
                .addComponents(menu);

            await interaction.reply({
                content: '🔧 Escolha o item:',
                components: [row],
                ephemeral: true
            });
        }
    }

    // MENU
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'arma_select') {

            const arma = interaction.values[0];

            userCraft[interaction.user.id] = {
                arma: arma
            };

            const modal = new ModalBuilder()
                .setCustomId('quantidade_modal')
                .setTitle('Quantidade do Craft');

            const quantidadeInput = new TextInputBuilder()
                .setCustomId('quantidade_input')
                .setLabel('Digite a quantidade')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 15')
                .setRequired(true);

            const modalRow = new ActionRowBuilder()
                .addComponents(quantidadeInput);

            modal.addComponents(modalRow);

            await interaction.showModal(modal);
        }
    }

    // MODAL
    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'quantidade_modal') {

            const quantidade = interaction.fields.getTextInputValue('quantidade_input');

            const craft = userCraft[interaction.user.id];

            const embed = new EmbedBuilder()
                .setTitle('🔫 NOVO CRAFT REGISTRADO')
                .setColor('Red')
                .addFields(
                    {
                        name: '👤 Funcionário',
                        value: interaction.user.username,
                        inline: true
                    },
                    {
                        name: '🔧 Item',
                        value: craft.arma,
                        inline: true
                    },
                    {
                        name: '📦 Quantidade',
                        value: quantidade,
                        inline: true
                    }
                )
                .setFooter({
                    text: 'Oeste RP • Sistema Profissional'
                })
                .setTimestamp();

            // CANAL DE LOGS
            const canalLogs = client.channels.cache.get(process.env.LOG_CHANNEL_ID);

            if (canalLogs) {
                await canalLogs.send({
                    embeds: [embed]
                });
            }

            // RESPOSTA PRIVADA
            await interaction.reply({
                content: '✅ Craft registrado com sucesso!',
                ephemeral: true
            });

            delete userCraft[interaction.user.id];
        }
    }

});

client.login(process.env.TOKEN);