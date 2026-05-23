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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
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
const vendaPendente = {};

// =========================
// BOT ONLINE
// =========================
client.once(Events.ClientReady, () => {
    console.log(`Bot online: ${client.user.tag}`);
});

console.log("LOG_VENDA_CHANNEL_ID:", process.env.LOG_VENDA_CHANNEL_ID);
console.log("LOG_COMPROVANTE_CHANNEL_ID:", process.env.LOG_COMPROVANTE_CHANNEL_ID);

// =========================
// INTERAÇÕES
// =========================
client.on(Events.InteractionCreate, async interaction => {

    // =========================
    // /painel
    // =========================
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'painel') {

            const embed = new EmbedBuilder()
                .setTitle('🔫 ARMARIA OESTE RP')
                .setDescription('Sistema de Vendas Profissional')
                .setColor('DarkRed');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('venda')
                        .setLabel('Registrar Venda')
                        .setStyle(ButtonStyle.Success)
                );

            return interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // =========================
    // BOTÃO VENDA
    // =========================
    if (interaction.isButton()) {

        if (interaction.customId === 'venda') {

            await interaction.deferReply({ ephemeral: true });

            const lista = [
                ...Object.keys(armas),
                ...Object.keys(municoes)
            ].slice(0, 25);

            const menu = new StringSelectMenuBuilder()
                .setCustomId('venda_select')
                .setPlaceholder('Selecione o item vendido')
                .addOptions(
                    lista.map(i => ({
                        label: i,
                        value: i
                    }))
                );

            return interaction.editReply({
                content: '💰 Escolha o item vendido:',
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }
    }
if (interaction.isStringSelectMenu() && interaction.customId === 'venda_select') {

    const item = interaction.values[0];

    userVenda[interaction.user.id] = { item };  

    const modal = new ModalBuilder()
        .setCustomId('venda_quantidade')
        .setTitle('Quantidade');

    const input = new TextInputBuilder()
        .setCustomId('quantidade')
        .setLabel('Digite a quantidade')
        .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(input);

    modal.addComponents(row);

    return interaction.showModal(modal);
}
    // =========================
    // SELECT ITEM
    // =========================
    if (interaction.isModalSubmit() && interaction.customId === 'venda_quantidade') {

        const quantidade = parseInt(
            interaction.fields.getTextInputValue('quantidade')
        );

        if (isNaN(quantidade) || quantidade <= 0) {
            return interaction.reply({
                content: '❌ Quantidade inválida.',
                ephemeral: true
            });
        }

        const data = userVenda[interaction.user.id];

        if (!data) {
            return interaction.reply({
                content: '❌ Sessão expirada.',
                ephemeral: true
            });
        }

        data.quantidade = quantidade;

        const menu = new StringSelectMenuBuilder()
            .setCustomId('venda_modo')
            .setPlaceholder('Escolha o tipo de venda')
            .addOptions([
                { label: 'Preço Mínimo', value: 'minimo' },
                { label: 'Preço Máximo', value: 'maximo' }
            ]);

        return interaction.reply({
            content: `📦 Item: ${data.item}\n🔢 Quantidade: ${quantidade}\n💰 Escolha o valor:`,
            ephemeral: true,
            components: [
                new ActionRowBuilder().addComponents(menu)
            ]
        });
    }

    // =========================
    // SELECT MODO
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === 'venda_modo') {

        await interaction.deferReply({ ephemeral: true });

        const modo = interaction.values[0];
        const data = userVenda[interaction.user.id];

        if (!data) {
            return interaction.editReply({
                content: '❌ Sessão expirada.'
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
                { name: '🔢 Quantidade', value: `${data.quantidade}`, inline: true },
                { name: '📦 Tipo', value: modo, inline: true },
                { name: '💰 Valor', value: `R$ ${valor.toFixed(2)}` },
                { name: '⚒️ Comissão (15%)', value: `R$ ${comissao.toFixed(2)}`, inline: true },
                { name: '🏢 Empresa', value: `R$ ${empresa.toFixed(2)}`, inline: true }
            )
            .setTimestamp();

        vendaPendente[interaction.user.id] = {
            embed,
            canalId: process.env.LOG_CHANNEL_ID
        };

        delete userVenda[interaction.user.id];

        return interaction.editReply({
            content: '📸 Agora envie a foto do comprovante no chat.'
        });
    }
});

// =========================
// COMPROVANTE (IMAGEM)
// =========================
client.on('messageCreate', async (message) => {
    console.log("TESTE MESSAGE:", message.content);

    if (message.author.bot) return;

    const venda = vendaPendente[message.author.id];
    if (!venda) return;

    if (message.attachments.size === 0) return;

    const imagem = message.attachments.first().url;

    try {
    const canal = await client.channels.fetch(venda.canalId);

    if (!canal) return console.log("Canal de log inválido");

    await canal.send({
        embeds: [venda.embed.setImage(imagem)]
    });

    delete vendaPendente[message.author.id];

} catch (err) {
    console.log("ERRO AO ENVIAR LOG:", err);
}

});

client.login(process.env.TOKEN);