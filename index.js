const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
// 1. Reset your token at https://discord.com/developers/applications
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1476597072974053426'; 
const GUILD_ID = '1475860440486641966'; 
const VERIFIED_TESTER_ROLE_ID = '1476235865922732232'; 
const RESULTS_CHANNEL_ID = '1475934478143590510'; 

// Role IDs for ranks
const ROLES = {
    HT4: '1476236320622776386',
    LT3: '1476236035649175777'
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
});

const commands = [
    new SlashCommandBuilder()
        .setName('tested')
        .setDescription('Mark a user as tested')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The Discord user who was tested')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The Minecraft IGN of the person tested')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rank')
                .setDescription('The rank they earned')
                .setRequired(true)
                .addChoices(
                    { name: 'Low Tier 5', value: 'LT5' },
                    { name: 'High Tier 5', value: 'HT5' },
                    { name: 'Low Tier 4', value: 'LT4' },
                    { name: 'High Tier 4', value: 'HT4' },
                    { name: 'Low Tier 3', value: 'LT3' },
                ))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully reloaded commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'tested') {
        if (!interaction.member.roles.cache.has(VERIFIED_TESTER_ROLE_ID)) {
            return interaction.reply({ content: '❌ No permission.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user');
        const mcUsername = interaction.options.getString('username');
        const rankValue = interaction.options.getString('rank');
        const tester = interaction.user; 

        try {
            // 1. Give the Role (HT4 and LT3 only)
            const member = await interaction.guild.members.fetch(targetUser.id);
            let roleGivenMessage = "";

            if (ROLES[rankValue]) {
                const role = interaction.guild.roles.cache.get(ROLES[rankValue]);
                if (role) {
                    await member.roles.add(role);
                    roleGivenMessage = ` and assigned the **${rankValue}** role`;
                }
            }

            // 2. Build the Embed
            const resultsEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`<@${targetUser.id}>`)
                .setFields(
                    { name: `${mcUsername}'s Test Results 🏆`, value: '\u200B' },
                    { name: 'Tester:', value: `<@${tester.id}>`, inline: false },
                    { name: 'Username:', value: `${mcUsername}`, inline: false },
                    { name: 'Rank Earned:', value: `**${rankValue}**`, inline: false }
                );

            const logChannel = await client.channels.fetch(RESULTS_CHANNEL_ID);
            const sentMessage = await logChannel.send({ 
                content: `<@${targetUser.id}>`, 
                embeds: [resultsEmbed] 
            });

            // 3. Auto-reactions
            const emojis = ['👑', '🥳', '😱', '😪', '😂', '💀'];
            for (const emoji of emojis) {
                await sentMessage.react(emoji);
            }

            await interaction.editReply({ 
                content: `✅ Logged results for **${mcUsername}**${roleGivenMessage}!` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Error processing test results. Check bot permissions (needs "Manage Roles").' });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Use the environment variable from Railway
client.login(process.env.DISCORD_TOKEN);

// Optional: basic ready message
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});