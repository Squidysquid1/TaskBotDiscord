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
		const db = new jsoning(`db/${interaction.guildId}.json`);
		switch (interaction.options.getSubcommand()) {

		// <task>
		case 'add': {
			// TODO: LIMIT AMOUNT OF TASKS PER SERVER at 10 SINCE 10 embeds IS MAX or make bot separate into multiple messages
			try {
				addTask(interaction, db);
			}
			catch (error) {
				console.log(`Error adding task:\n ${error}`);
			}
		} break;

		case 'list': {
			// TODO: Add a bunch of checks to make sure code does not break
			try {
				listTask(interaction, db);
			}
			catch (error) {
				console.log(`Error listing task:\n ${error}`);
			}
		} break;

		// <task>
		case 'remove': {
			// TODO: remove all subtasks assiciated with that task
			try {
				removeTask(interaction, db);
			}
			catch (error) {
				console.log(`Error listing task:\n ${error}`);
			}
		} break;

		// <task> <subtask>
		case 'addsubtask': {
			// TODO: LIMIT to 25 SUB tasks since 25 fields is max
			try {
				addSubTask(interaction, db);
			}
			catch (error) {
				console.log(`Error adding subtask:\n ${error}`);
			}
		} break;

		// <task> <subtask>
		case 'removesubtask': {
			try {
				removeSubtask(interaction, db);
			}
			catch (error) {
				console.log(`Error removing subtask:\n ${error}`);
			}
		} break;

		// <task> <subtask> <complete>
		case 'completesubtask': {
			try {
				completeSubTask(interaction, db);
			}
			catch (error) {
				console.log(`Error completing subtask:\n ${error}`);
			}
		} break;

		default: {
			await interaction.reply('No command specified');
		} break;
		}
	},
};

async function addTask(interaction, db) {
	await db.push('tasks', interaction.options.getString('name'));
	await interaction.reply(`Task \`${interaction.options.getString('name')}\` was added!`);
}

async function listTask(interaction, db) {
	if (await db.get('tasks')) {
		const embeds = [];
		for (const task of await db.get('tasks')) {
			const embed = new EmbedBuilder()
			// 0x01FF07 green 0xB01B2E red
				.setColor(0x01FF07)
				.setTitle(task);

			if (await db.get(task)) {
				for (const subtask of await db.get(task)) {
					if (subtask.complete == ':x:') {
						embed.setColor(0xB01B2E);
					}
					embed.addFields({ name: `${subtask.complete} ${subtask.subtask}`, value: '\u200B' });
				}
			}
			else {
				embed.addFields({ name: 'No subtasks added yet', value: '\u200B' });
			}
			embeds.push(embed);

		}
		await interaction.reply({ embeds: embeds });
	}
	else {
		await interaction.reply('No tasks! Please create a task with `/task add`');
	}
}

async function removeTask(interaction, db) {
	if (await db.get('tasks').includes(interaction.options.getString('task')) != null) {
		await db.remove('tasks', interaction.options.getString('task'));
		await db.delete(interaction.options.getString('task'));
		await interaction.reply(`Successfully removed ${interaction.options.getString('task')}`);
	}
	else {
		await interaction.reply(`Task ${interaction.options.getString('task')} does not exist please check your spelling`);
	}
}

async function addSubTask(interaction, db) {
	const subtasks = await db.get(interaction.options.getString('task'));
	const tasks = await db.get('tasks');
	if (tasks.includes(interaction.options.getString('task'))) {
		if (subtasks == null) {
			await db.push(interaction.options.getString('task'), { subtask: interaction.options.getString('subtask'), complete: ':x:' });
			await interaction.reply('Added subtask sucessfully');
		}
		else {
			let found = false;
			for (const subtask of subtasks) {
				if (subtask.subtask == interaction.options.getString('subtask')) {
					found = true;
					await interaction.reply('Subtask already exists');
				}
			}
			if (!found) {
				await db.push(interaction.options.getString('task'), { subtask: interaction.options.getString('subtask'), complete: ':x:' });
				await interaction.reply('Added subtask sucessfully');
			}
		}
	}
	else {
		// TODO: maybe add the task if it does not exist not sure :P
		await interaction.reply('Task does not exist, please create one!');
	}
}

async function removeSubtask(interaction, db) {
	const subtasks = db.get(interaction.options.getString('task'));
	const tasks = await db.get('tasks');
	if (tasks.includes(interaction.options.getString('task'))) {
		let found = false;
		for (const subtask of subtasks) {
			if (subtask.subtask == interaction.options.getString('subtask')) {
				found = true;
				// remove
				await db.set(interaction.options.getString('task'), subtasks.filter(obj => obj.subtask != interaction.options.getString('subtask')));
				await interaction.reply('removed subtask');
			}
		}
		if (!found) {
			await interaction.reply(`No subtask named ${interaction.options.getString('subtask')} to remove`);
		}
	}
	else {
		// TODO: maybe add the task if it does not exist not sure :P
		await interaction.reply('Task does not exist, please create one!');
	}
}

async function completeSubTask(interaction, db) {
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
}