require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
    StringSelectMenuBuilder
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =========================
// TABELAS
// =========================
const armas = {
  "Cattleman": { min: 90, max: 105 },
  "Ação Dupla": { min: 125, max: 145 },
  "Schofield": { min: 130, max: 150 },
  "Lemat": { min: 185, max: 215 },
  "Navy": { min: 210, max: 240 },
  "Volcanic": { min: 135, max: 160 },
  "Mauser": { min: 190, max: 225 },
  "Semi-Automática": { min: 230, max: 270 },
  "M1899": { min: 245, max: 285 },
  "Carabina": { min: 280, max: 325 },
  "Henry": { min: 305, max: 360 },
  "Evans": { min: 360, max: 416 },
  "Winchester": { min: 370, max: 430 },
  "Varmint": { min: 250, max: 290 },
  "Springfield": { min: 310, max: 360 },
  "Ferrolho": { min: 380, max: 445 },
  "Cano Duplo": { min: 375, max: 440 },
  "Espingarda Repetidora": { min: 363, max: 425 },
  "Espingarda Semi-Automática": { min: 450, max: 528 }
};

const municoes = {
  "Munição de Revolver": { min: 6.60, max: 7.70 },
  "Munição de Pistola": { min: 6.60, max: 7.70 },
  "Munição de Repetição": { min: 8.40, max: 9.80 },
  "Munição de Rifle": { min: 8.70, max: 10.10 },
  "Munição de Escopeta": { min: 9.00, max: 10.50 },
  "Munição de Rifle Elephant": { min: 11.90, max: 13.90 },
  "Munição de Varmint": { min: 5.20, max: 6.10 },
  "Munição de Varmint Tranquilizante": { min: 6.10, max: 7.20 }
};

const userVenda = {};

client.once(Events.ClientReady, () => {
    console.log(`Bot online: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    // =========================
    // /painel
    // =========================
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'painel') {

            const embed = new EmbedBuilder()
                .setTitle('🔫 ARMARIA OESTE RP')
                .setDescription('Sistema de Craft e Vendas Profissional')
                .setColor('DarkRed');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('craft')
                        .setLabel('Registrar Craft')
                        .setStyle(ButtonStyle.Danger),

                    new ButtonBuilder()
                        .setCustomId('venda')
                        .setLabel('Registrar Venda')
                        .setStyle(ButtonStyle.Success)
                );

            // 🔥 FIX DEFINITIVO DO 10062
            try {
                await interaction.deferReply();
                return await interaction.editReply({
                    embeds: [embed],
                    components: [row]
                });
            } catch (err) {
                console.log("Erro painel:", err);
            }
        }
    }

    // =========================
    // BOTÕES
    // =========================
    if (interaction.isButton()) {

        if (interaction.customId === 'craft') {

            const menu = new StringSelectMenuBuilder()
                .setCustomId('venda_select')
                .setPlaceholder('Selecione o item')
                .addOptions([
                    ...Object.keys(armas).map(a => ({ label: a, value: a })),
                    ...Object.keys(municoes).map(m => ({ label: m, value: m }))
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.deferReply({ ephemeral: true });

            return interaction.editReply({
                content: '🔧 Escolha o item:',
                components: [row]
            });
        }

        if (interaction.customId === 'venda') {

            const menu = new StringSelectMenuBuilder()
                .setCustomId('venda_select')
                .setPlaceholder('Selecione o item vendido')
                .addOptions([
                    ...Object.keys(armas).map(a => ({ label: a, value: a })),
                    ...Object.keys(municoes).map(m => ({ label: m, value: m }))
                ]);

            return interaction.reply({
                content: '💰 Escolha o item vendido:',
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }
    }

    // =========================
    // SELECT MENU
    // =========================
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'venda_select') {

            const item = interaction.values[0];
            userVenda[interaction.user.id] = { item };

            const menu = new StringSelectMenuBuilder()
                .setCustomId('venda_modo')
                .setPlaceholder('Escolha o tipo de venda')
                .addOptions([
                    { label: 'Preço Mínimo', value: 'minimo' },
                    { label: 'Preço Máximo', value: 'maximo' }
                ]);

            return interaction.reply({
                content: '📦 Escolha o valor da venda:',
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        if (interaction.customId === 'venda_modo') {

            const modo = interaction.values[0];
            const data = userVenda[interaction.user.id];

            if (!data) {
                return interaction.reply({
                    content: '❌ Sessão expirada.',
                    ephemeral: true
                });
            }

            const item = data.item;
            const tabela = armas[item] ? armas : municoes;
            const valores = tabela[item];

            const valor = modo === 'minimo' ? valores.min : valores.max;

            const comissao = valor * 0.15;
            const empresa = valor - comissao;

            const embed = new EmbedBuilder()
                .setTitle('💰 VENDA REGISTRADA')
                .setColor('Green')
                .addFields(
                    { name: '👤 Funcionário', value: interaction.user.username, inline: true },
                    { name: '🔫 Item', value: item, inline: true },
                    { name: '📦 Tipo', value: modo, inline: true },
                    { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` },
                    { name: '⚒️ Comissão (15%)', value: `R$ ${comissao.toFixed(2)}`, inline: true },
                    { name: '🏢 Empresa', value: `R$ ${empresa.toFixed(2)}`, inline: true }
                )
                .setTimestamp();

            const canalLogs = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

            if (canalLogs) {
                await canalLogs.send({ embeds: [embed] });
            }

            delete userVenda[interaction.user.id];

            return interaction.reply({
                content: '✅ Venda registrada com sucesso!',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);