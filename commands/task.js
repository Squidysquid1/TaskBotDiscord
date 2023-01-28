const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const jsoning = require('jsoning');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('task')
		.setDescription('Manages tasks')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Creates a new task')
				.addStringOption(option =>
					option.setName('name')
						.setRequired(true)
						.setDescription('Name of task'),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('Lists all current tasks with subtasks'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Removes a task')
				.addStringOption(option =>
					option.setName('task')
						.setRequired(true)
						.setDescription('Task to remove (type name exactly)')),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('addsubtask')
				.setDescription('Creates a new subtask')
				.addStringOption(option =>
					option.setName('task')
						.setRequired(true)
						.setDescription('Name of the task (type name exactly)'))
				.addStringOption(option =>
					option.setName('subtask')
						.setRequired(true)
						.setDescription('Name of the subtask (type name exactly)')),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('removesubtask')
				.setDescription('Removes a subtask from a task')
				.addStringOption(option =>
					option.setName('task')
						.setRequired(true)
						.setDescription('Name of task (type name exactly)'))
				.addStringOption(option =>
					option.setName('subtask')
						.setRequired(true)
						.setDescription('Name of subtask (type name exactly)')),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('completesubtask')
				.setDescription('Changes status of a subtask')
				.addStringOption(option =>
					option.setName('task')
						.setRequired(true)
						.setDescription('Name of the task (type name exactly)'))
				.addStringOption(option =>
					option.setName('subtask')
						.setRequired(true)
						.setDescription('Name of the subtask (type name exactly)'))
				.addBooleanOption(option =>
					option.setName('complete')
						.setRequired(true)
						.setDescription('Sets status to either true or false')),
		),

	async execute(interaction) {
		const db = new jsoning(`${interaction.guildId}.json`);
		switch (interaction.options.getSubcommand()) {

		case 'add': {
			await db.push('tasks', interaction.options.getString('name'));
			addTask(interaction);
		} break;

		case 'list': {
			// TODO: Add a bunch of checks to make sure code does not break
			const embeds = [];
			for (const task of await db.get('tasks')) {
				const embed = new EmbedBuilder()
				// 01FF07 green B01B2E red
					.setColor(0x01FF07)
					.setTitle(task);
				// :white_check_mark: :x:
				for (const subtask of await db.get(task)) {
					if (subtask.complete == ':x:') {
						embed.setColor(0xB01B2E);
					}
					embed.addFields({ name: `${subtask.complete} ${subtask.subtask}`, value: '\u200B' });
				}
				embeds.push(embed);

			}
			await interaction.reply({ embeds: embeds });
		} break;

		case 'remove': {
			if (await db.get('tasks').includes(interaction.options.getString('task'))) {
				await db.remove('tasks', interaction.options.getString('task'));
				await interaction.reply(`Successfully removed ${interaction.options.getString('task')}`);
			}
			else {
				await interaction.reply(`Task ${interaction.options.getString('task')} does not exist please check your spelling`);
			}
		} break;

		// <task> <subtask>
		case 'addsubtask': {
			// TODO: check if subtask already exists
			await db.push(interaction.options.getString('task'), { subtask: interaction.options.getString('subtask'), complete: ':x:' });
			await interaction.reply('Added subtask sucessfully');
		} break;

		case 'removesubtask': {
			// 					await db.set(subtasks.filter(function(subTask) { return subTask.subtask !=  }) );
			await interaction.reply();
		} break;

		// <task> <subtask> <complete>
		case 'completesubtask': {
			// :white_check_mark: :x:
			const subtasks = await db.get(interaction.options.getString('task'));
			for (const subtask of subtasks) {
				if (subtask.subtask == interaction.options.getString('subtask')) {
					if (interaction.options.getBoolean('complete')) {
						subtask.complete = ':white_check_mark:';
					}
					else {
						subtask.complete = ':x:';
					}

					await db.set(interaction.options.getString('task'), subtasks);
					break;
				}
			}
			await interaction.reply('Changed subtask status!');
		} break;

		default: {
			await interaction.reply('No command specified');
		} break;
		}
	},
};

async function addTask(interaction) {
	await interaction.reply(`This command was run by ${interaction.user.username}, This command is not implemented yet thanks :P}.`);
}